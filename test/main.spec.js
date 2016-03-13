'use strict';

import chai from 'chai';
import sinon from 'sinon';
import mockery from 'mockery';
import Promise from 'pinkie-promise';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
const Schema = () => {};
const expect = chai.expect;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('mongoose-plugin-seed', () => {
  const execStub = sinon.stub().returns(Promise.resolve());
  const modelMock = name => {
    return {
      modelName: name,
      collection: {
        drop: sinon.stub().yields()
      },
      create: sinon.stub().returnsArg(0),
      remove: sinon.stub().returns({exec: execStub})
    };
  };

  mockery.registerMock('mongoose', {
    model: modelMock
  });

  mockery.enable({
    useCleanCache: true,
    warnOnReplace: false,
    warnOnUnregistered: false
  });

  const mongooseSeed = require('../src');

  after(() => {
    mockery.deregisterMock('mongoose');
    mockery.disable();
  });

  describe('exports', () => {
    it('should expose a function', () => {
      expect(mongooseSeed.addSeed).to.be.a('function');
      expect(mongooseSeed.createSeedModel).to.be.a('function');
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

  describe('createSeedModel', () => {
    describe('should fail', () => {
      it('without name', () => {
        expect(() => mongooseSeed.createSeedModel()).to.throw(TypeError, 'mongoose-plugin-seed: name must be provided');
      });

      it('with name as an object', () => {
        expect(() => mongooseSeed.createSeedModel({})).to.throw(TypeError, 'mongoose-plugin-seed: name must be a string');
      });

      it('without Schema', () => {
        expect(() => mongooseSeed.createSeedModel('asd')).to.throw(TypeError, 'mongoose-plugin-seed: Schema must be provided');
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

    const AData = [{name: 'Hello'}];
    const BData = [{name: 'Hello'}];
    const CData = [{name: 'Hello'}];

    const CSeed = {
      seed: sinon.stub().returns(Promise.resolve(CData))
    };

    const CModel = modelMock('C', CSchema);

    const BSeed = {
      dependencies: [CModel],
      seed: sinon.stub().returns(Promise.resolve(BData)),
      drop: true
    };

    const BModel = modelMock('B', BSchema);

    const ASeed = {
      dependencies: [BModel, CModel],
      seed: sinon.stub().returns(Promise.resolve(AData))
    };

    mongooseSeed.addSeed(CModel, CSeed);
    mongooseSeed.addSeed(BModel, BSeed);
    mongooseSeed.createSeedModel('A', ASchema, ASeed);

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

    it('should call B', () => {
      expect(BModel.collection.drop).to.have.callCount(1);
    });
  });
});