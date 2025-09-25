import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.b781372df7a24ebb852cd3958c82df31',
  appName: 'prolo-sparkle-auth',
  webDir: 'dist',
  server: {
    url: 'https://b781372d-f7a2-4ebb-852c-d3958c82df31.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  bundledWebRuntime: false
};

export default config;