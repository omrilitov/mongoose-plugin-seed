'use strict';

import chai from 'chai';
import sinon from 'sinon';
import Promise from 'pinkie-promise';
import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const expect = chai.expect;

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('mongoose-plugin-seed', () => {
  const mockModel = Model => {
    const execStub = sinon.stub().returns(Promise.resolve());

    Model.create = sinon.stub().returnsArg(0);
    Model.remove = sinon.stub().returns({exec: execStub});

    return Model;
  };
  const mongooseSeed = require('../src');

  describe('exports', () => {
    it('should expose a function', () => {
      expect(mongooseSeed.addSeed).to.be.a('function');
      expect(mongooseSeed.seed).to.be.a('function');
    });
  });

  describe('addSeed', () => {
    describe('should fail', () => {
      it('without Model', () => {
        expect(() => mongooseSeed.addSeed()).to.throw(TypeError, 'mongoose-plugin-seed: Model must be provided');
      });

      it('without options', () => {
        expect(() => mongooseSeed.addSeed({}, {seed: {}})).to.throw(TypeError, 'mongoose-plugin-seed: seed must be a function');
      });

      it('without seed', () => {
        expect(() => mongooseSeed.addSeed({}, {})).to.throw(TypeError, 'mongoose-plugin-seed: seed function must be provided');
      });

      it('with seed as an object', () => {
        expect(() => mongooseSeed.addSeed({}, {seed: {}})).to.throw(TypeError, 'mongoose-plugin-seed: seed must be a function');
      });

      it('with dependencies as an object', () => {
        expect(() => mongooseSeed.addSeed({}, {
          seed: () => {
          }, dependencies: {}
        })).to.throw(TypeError, 'mongoose-plugin-seed: dependencies must be an array');
      });
    });
  });

  describe('seed (a->b->c)', () => {
    const ASchema = new Schema({
      name: String
    });

    const BSchema = new Schema({
      name: String
    });

    const CSchema = new Schema({
      name: String
    });

    const AModel = mockModel(mongoose.model('A', ASchema));
    const BModel = mockModel(mongoose.model('B', BSchema));
    const CModel = mockModel(mongoose.model('C', CSchema));

    const AData = [{name: 'Hello'}];
    const BData = [{name: 'Hello'}];
    const CData = [{name: 'Hello'}];

    const ASeed = {
      dependencies: [BModel, CModel],
      seed: sinon.stub().returns(Promise.resolve(AData))
    };

    const BSeed = {
      dependencies: [CModel],
      seed: sinon.stub().returns(Promise.resolve(BData))
    };

    const CSeed = {
      seed: sinon.stub().returns(Promise.resolve(CData))
    };

    mongooseSeed.addSeed(AModel, ASeed);
    mongooseSeed.addSeed(BModel, BSeed);
    mongooseSeed.addSeed(CModel, CSeed);

    before(cb => {
      mongooseSeed.seed()
        .then(() => {
          cb();
        })
        .catch(cb);
    });

    it('should call C seed before B seed', () => {
      expect(CSeed.seed).calledBefore(BSeed.seed);
    });

    it('should call C seed before A seed', () => {
      expect(CSeed.seed).calledBefore(ASeed.seed);
    });

    it('should call B seed before A seed', () => {
      expect(BSeed.seed).calledBefore(ASeed.seed);
    });

    it('should call B seed with C', () => {
      expect(BSeed.seed).calledWithExactly(CData);
    });

    it('should call A seed with B and C', () => {
      expect(ASeed.seed).calledWithExactly(AData, BData);
    });
  });
});