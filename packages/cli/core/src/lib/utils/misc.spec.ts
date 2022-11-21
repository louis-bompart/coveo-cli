import {getPackageVersion} from './misc.js';

describe('#getPackageVersion', () => {
  const filledPackageJson = {
    dependencies: {myPackage: '1.0.0'},
    devDependencies: {myPackage: '2.0.0'},
    peerDependencies: {myPackage: '3.0.0'},
  };

  const mockPackageJson = (packageJson: Object) => {
    jest.mock('../../../package.json', () => packageJson, {virtual: true});
  };

  afterEach(() => {
    jest.resetAllMocks();
    jest.resetModules();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should try to resolve to the production dependencies first', () => {
    mockPackageJson(filledPackageJson);

    expect(getPackageVersion('myPackage')).toBe('1.0.0');
  });

  describe('when the package is not in the production dependencies', () => {
    beforeEach(() => {
      mockPackageJson({
        ...filledPackageJson,
        dependencies: {},
      });
    });

    it('should fallback to the dev dependencies', () => {
      expect(getPackageVersion('myPackage')).toBe('2.0.0');
    });
  });

  describe('when the package is not in the production or dev dependencies', () => {
    beforeEach(() => {
      mockPackageJson({
        ...filledPackageJson,
        dependencies: {},
        devDependencies: {},
      });
    });

    it('should fallback to the peer dependencies', () => {
      expect(getPackageVersion('myPackage')).toBe('3.0.0');
    });
  });

  describe('when the package is not in any dependency lists', () => {
    beforeEach(() => {
      mockPackageJson({
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
      });
    });

    it('should return null', () => {
      expect(getPackageVersion('myPackage')).toBeNull();
    });
  });

  describe('when the dependency is a prerelease', () => {
    beforeEach(() => {
      mockPackageJson({
        dependencies: {myPackage: '1.0.0-1'},
        devDependencies: {},
        peerDependencies: {},
      });
    });

    it('should return the full prerelease', () => {
      expect(getPackageVersion('myPackage')).toBe('1.0.0-1');
    });
  });
});
