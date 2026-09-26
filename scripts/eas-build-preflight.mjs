import { runPreflight } from './release-preflight.mjs';

const { APP_VARIANT: variant, EAS_BUILD_PLATFORM: platform, EAS_BUILD_PROFILE: profile } = process.env;
if (['development', 'development-simulator'].includes(profile) && variant === 'development') {
  process.stdout.write('Development build: release service credentials are not required.\n');
} else if (!['ios', 'android'].includes(platform)) {
  process.stderr.write('EAS_BUILD_PLATFORM must be ios or android.\n');
  process.exitCode = 1;
} else if (!['preview', 'production'].includes(profile) || variant !== profile) {
  process.stderr.write('Release APP_VARIANT must match the preview or production EAS_BUILD_PROFILE.\n');
  process.exitCode = 1;
} else {
  process.exitCode = runPreflight(process.env, variant, platform);
}
