// Platform build keeps the original SDK; standalone builds alias this module.
export const publicFeed: boolean = false;
export {
  AppContainer,
  ErrorRender,
  capabilityClient,
  scopedStorage,
  logger,
  resolveAppUrl,
} from '@lark-apaas/client-toolkit-lite';
