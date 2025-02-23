jest.mock('@amplitude/node');
jest.mock('@amplitude/identify');
jest.mock('@coveo/platform-client');
jest.mock('../platform/authenticatedClient');
jest.mock('../config/config');
jest.mock('../config/globalConfig');

import os from 'os';
import {Identify} from '@amplitude/identify';
import {Config, Configuration} from '../config/config';
import {AuthenticatedClient} from '../platform/authenticatedClient';
import {Identifier} from './identifier';
import PlatformClient from '@coveo/platform-client';
import {configurationMock, defaultConfiguration} from '../config/stub';
import type {Interfaces} from '@oclif/core';
import type {NodeClient} from '@amplitude/node';
import globalConfig from '../config/globalConfig';

describe('identifier', () => {
  const mockedGlobalConfig = jest.mocked(globalConfig);
  const mockedConfig = jest.mocked(Config);
  const mockedIdentify = jest.mocked(Identify);
  const mockedAuthenticatedClient = jest.mocked(AuthenticatedClient);
  const mockedPlatformClient = jest.mocked(PlatformClient);
  const mockUserGet = jest.fn();
  const mockSetIdentity = jest.fn();
  const mockedLogEvent = jest.fn();
  const mockedOsVersion = jest.spyOn(os, 'release');

  let identity: Awaited<ReturnType<Identifier['getIdentity']>>;

  const getDummyAmplitudeClient = () =>
    ({
      logEvent: mockedLogEvent,
    } as unknown as NodeClient);

  const doMockOS = () => {
    mockedOsVersion.mockReturnValue('21.3.4');
  };
  const doMockIdentify = () => {
    mockedIdentify.prototype.set.mockImplementation(mockSetIdentity);
  };
  const doMockPlatformClient = (email = '') => {
    mockedPlatformClient.mockImplementation(
      () =>
        ({
          initialize: () => Promise.resolve(),
          user: {
            get: mockUserGet.mockResolvedValue({
              email,
            }),
          },
          organization: {
            get: jest.fn().mockResolvedValue({type: 'Production'}),
          },
        } as unknown as PlatformClient)
    );
  };
  const doMockConfiguration = (
    overrideConfiguration?: Partial<Configuration>
  ) => {
    mockedConfig.mockImplementation(
      configurationMock({...defaultConfiguration, ...overrideConfiguration})
    );
  };
  const doMockAuthenticatedClient = () => {
    mockedAuthenticatedClient.mockImplementation(
      () =>
        ({
          getClient: () =>
            Promise.resolve(
              mockedPlatformClient.getMockImplementation()!({
                accessToken: 'foo',
                organizationId: 'bar',
              })
            ),
          cfg: mockedConfig.getMockImplementation()!('./'),
        } as unknown as AuthenticatedClient)
    );
  };

  const mockForInternalUser = async () => {
    doMockConfiguration();
    doMockPlatformClient('bob@coveo.com');
  };
  const mockForInternalTestUser = async () => {
    doMockConfiguration();
    doMockPlatformClient('bob@devcoveo.onmicrosoft.com');
  };
  const mockForExternalUser = async () => {
    doMockConfiguration();
    doMockPlatformClient('bob@acme.com');
  };
  const mockForAnonymousUser = async () => {
    doMockConfiguration({anonymous: true});
    doMockPlatformClient();
  };

  beforeAll(() => {
    mockedGlobalConfig.get.mockReturnValue({
      configDir: 'the_config_dir',
      version: '1.2.3',
      platform: 'darwin',
    } as Interfaces.Config);
  });

  beforeEach(() => {
    doMockOS();
    doMockIdentify();
    doMockAuthenticatedClient();
  });

  describe.each([
    {
      describeName: 'when the user is internal',
      mockFn: mockForInternalUser,
      email: 'bob@coveo.com',
    },
    {
      describeName: 'when the user is test internal',
      mockFn: mockForInternalTestUser,
      email: 'bob@devcoveo.onmicrosoft.com',
    },
  ])(
    '$describeName',
    ({mockFn, email}: {mockFn: () => Promise<void>; email: string}) => {
      beforeEach(async () => {
        await mockFn();
        identity = await new Identifier().getIdentity();
      });

      afterEach(() => {
        mockUserGet.mockClear();
        mockedPlatformClient.mockClear();
      });

      it('should not set platform information', async () => {
        expect(mockSetIdentity).not.toHaveBeenCalledWith(
          'organization_type',
          'Production'
        );
        expect(mockSetIdentity).not.toHaveBeenCalledWith('environment', 'dev');
        expect(mockSetIdentity).not.toHaveBeenCalledWith('region', 'us');
      });

      it('should set the user ID with (unhashed) email', async () => {
        expect(identity.userId).toBe(email);
      });

      it('should set is_internal_user to true', async () => {
        expect(mockSetIdentity).toHaveBeenCalledWith('is_internal_user', true);
      });

      it('should identify event with (unhashed) email', async () => {
        expect(identity.userId).toBe(email);
      });

      it('should always identify events with a device ID', async () => {
        expect(identity.deviceId).toBeDefined();
      });
    }
  );

  describe('when the user is external', () => {
    beforeEach(async () => {
      await mockForExternalUser();
      identity = await new Identifier().getIdentity();
    });

    it('should set the user ID (hashed)', async () => {
      expect(identity.userId).not.toBeNull();
      expect(identity.userId).not.toBe('bob@acme.com');
    });

    it('should set is_internal_user to false', async () => {
      expect(mockSetIdentity).toHaveBeenCalledWith('is_internal_user', false);
    });
  });

  describe('when the user is anonymous', () => {
    beforeEach(async () => {
      await mockForAnonymousUser();
      identity = await new Identifier().getIdentity();
    });

    it('should set the user ID', async () => {
      expect(identity.userId).not.toBeNull();
    });
  });

  describe('when logging for every user type', () => {
    beforeEach(async () => {
      identity = await new Identifier().getIdentity();
      identity.identify(getDummyAmplitudeClient());
    });

    it('should add the CLI version to the event', async () => {
      expect(mockedLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({app_version: '1.2.3'})
      );
    });

    it('should add the OS information to the event', async () => {
      expect(mockedLogEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          app_version: '1.2.3',
          os_name: 'darwin',
          os_version: '21.3.4',
          platform: 'darwin',
        })
      );
    });
  });
});
