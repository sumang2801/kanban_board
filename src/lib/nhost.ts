import { NhostClient } from '@nhost/nextjs';

const nhost = new NhostClient({
  subdomain: process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'xakuxhqdhfmxusxlsfku',
  region: process.env.NEXT_PUBLIC_NHOST_REGION || 'us-east-1'
});

export default nhost;
