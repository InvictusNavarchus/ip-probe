import { IPAddress, IPRange } from '@/types/ip';
import { logger } from '@/utils/logger';
import ip from 'ip';
import { isIP } from 'net';

export class IPClassificationService {
  // Private IP ranges as defined by RFC 1918, RFC 4193, etc.
  private static readonly PRIVATE_RANGES: IPRange[] = [
    // IPv4 Private ranges
    {
      start: '10.0.0.0',
      end: '10.255.255.255',
      cidr: '10.0.0.0/8',
      type: 'private',
      description: 'RFC 1918 - Class A'
    },
    {
      start: '172.16.0.0',
      end: '172.31.255.255',
      cidr: '172.16.0.0/12',
      type: 'private',
      description: 'RFC 1918 - Class B'
    },
    {
      start: '192.168.0.0',
      end: '192.168.255.255',
      cidr: '192.168.0.0/16',
      type: 'private',
      description: 'RFC 1918 - Class C'
    },

    // IPv6 Private ranges
    {
      start: 'fc00::',
      end: 'fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      cidr: 'fc00::/7',
      type: 'private',
      description: 'RFC 4193 - Unique Local'
    },
    {
      start: 'fe80::',
      end: 'febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      cidr: 'fe80::/10',
      type: 'private',
      description: 'RFC 4291 - Link Local'
    }
  ];

  // Reserved IP ranges
  private static readonly RESERVED_RANGES: IPRange[] = [
    // IPv4 Reserved ranges
    {
      start: '0.0.0.0',
      end: '0.255.255.255',
      cidr: '0.0.0.0/8',
      type: 'reserved',
      description: 'RFC 1122 - This network'
    },
    {
      start: '127.0.0.0',
      end: '127.255.255.255',
      cidr: '127.0.0.0/8',
      type: 'reserved',
      description: 'RFC 1122 - Loopback'
    },
    {
      start: '169.254.0.0',
      end: '169.254.255.255',
      cidr: '169.254.0.0/16',
      type: 'reserved',
      description: 'RFC 3927 - Link Local'
    },
    {
      start: '224.0.0.0',
      end: '239.255.255.255',
      cidr: '224.0.0.0/4',
      type: 'reserved',
      description: 'RFC 3171 - Multicast'
    },
    {
      start: '240.0.0.0',
      end: '255.255.255.254',
      cidr: '240.0.0.0/4',
      type: 'reserved',
      description: 'RFC 1112 - Reserved'
    },
    {
      start: '255.255.255.255',
      end: '255.255.255.255',
      cidr: '255.255.255.255/32',
      type: 'reserved',
      description: 'RFC 919 - Broadcast'
    },

    // IPv6 Reserved ranges
    { start: '::', end: '::', cidr: '::/128', type: 'reserved', description: 'RFC 4291 - Unspecified' },
    { start: '::1', end: '::1', cidr: '::1/128', type: 'reserved', description: 'RFC 4291 - Loopback' },
    {
      start: '::ffff:0:0',
      end: '::ffff:ffff:ffff',
      cidr: '::ffff:0:0/96',
      type: 'reserved',
      description: 'RFC 4291 - IPv4 Mapped'
    },
    {
      start: '2001:db8::',
      end: '2001:db8:ffff:ffff:ffff:ffff:ffff:ffff',
      cidr: '2001:db8::/32',
      type: 'reserved',
      description: 'RFC 3849 - Documentation'
    },
    {
      start: 'ff00::',
      end: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
      cidr: 'ff00::/8',
      type: 'reserved',
      description: 'RFC 4291 - Multicast'
    }
  ];

  /**
   * Classify an IP address type
   */
  static classifyIP(ipAddress: string): IPAddress['type'] {
    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    // Check if it's a loopback address
    if (ip.isLoopback(ipAddress)) {
      return 'loopback';
    }

    // Check if it's a private address
    if (ip.isPrivate(ipAddress)) {
      return 'private';
    }

    // Check reserved ranges (but exclude IPv6 ranges for IPv4 addresses)
    const ipVersion = isIP(ipAddress) as 4 | 6;
    const relevantReservedRanges = this.RESERVED_RANGES.filter(range => {
      const isIPv4 = ipVersion === 4;
      const isRangeIPv4 = !range.cidr.includes(':');
      return isIPv4 === isRangeIPv4;
    });

    if (this.isInRanges(ipAddress, relevantReservedRanges)) {
      return 'reserved';
    }

    // Check for multicast
    if (this.isMulticast(ipAddress)) {
      return 'multicast';
    }

    // Check for broadcast
    if (this.isBroadcast(ipAddress)) {
      return 'broadcast';
    }

    // If none of the above, it's public
    return 'public';
  }

  /**
   * Get detailed information about an IP address
   */
  static getIPDetails(ipAddress: string): any {
    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    const version = isIP(ipAddress) as 4 | 6;
    const type = this.classifyIP(ipAddress);
    const range = this.findIPRange(ipAddress);

    const details = {
      address: ipAddress,
      version,
      type,
      range
    };

    // Add version-specific details
    if (version === 4) {
      const ipv4Details = {
        binary: this.ipToBinary(ipAddress),
        decimal: this.ipToDecimal(ipAddress),
        subnet: this.getSubnet(ipAddress),
        cidr: this.getCIDR(ipAddress)
      };
      return { ...details, ...ipv4Details };
    }

    // Add IPv6 specific details
    const ipv6Details = {
      subnet: this.getIPv6Subnet(ipAddress),
      cidr: this.getIPv6CIDR(ipAddress)
    };
    return { ...details, ...ipv6Details };
  }

  /**
   * Calculate subnet information for an IP
   */
  static calculateSubnet(
    ipAddress: string,
    subnetMask: string
  ): {
    network: string;
    broadcast: string;
    firstHost: string;
    lastHost: string;
    totalHosts: number;
    usableHosts: number;
    cidr: string;
  } {
    if (!isIP(ipAddress) || !isIP(subnetMask)) {
      throw new Error('Invalid IP address or subnet mask');
    }

    try {
      const subnet = ip.subnet(ipAddress, subnetMask);

      return {
        network: subnet.networkAddress,
        broadcast: subnet.broadcastAddress,
        firstHost: subnet.firstAddress,
        lastHost: subnet.lastAddress,
        totalHosts: subnet.numHosts,
        usableHosts: Math.max(0, subnet.numHosts - 2), // Subtract network and broadcast
        cidr: `${subnet.networkAddress}/${subnet.subnetMaskLength}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Subnet calculation failed', { ipAddress, subnetMask, error: errorMessage });
      throw new Error('Failed to calculate subnet information');
    }
  }

  /**
   * Convert CIDR to subnet mask
   */
  static cidrToSubnetMask(cidr: number): string {
    if (cidr < 0 || cidr > 32) {
      throw new Error('CIDR must be between 0 and 32');
    }

    const mask = (0xffffffff << (32 - cidr)) >>> 0;
    return [(mask >>> 24) & 0xff, (mask >>> 16) & 0xff, (mask >>> 8) & 0xff, mask & 0xff].join('.');
  }

  /**
   * Convert subnet mask to CIDR
   */
  static subnetMaskToCidr(subnetMask: string): number {
    if (!isIP(subnetMask)) {
      throw new Error('Invalid subnet mask');
    }

    const parts = subnetMask.split('.').map(Number);
    let cidr = 0;

    for (const part of parts) {
      const binary = part.toString(2).padStart(8, '0');
      const ones = binary.indexOf('0');
      cidr += ones === -1 ? 8 : ones;
      if (ones !== -1) break;
    }

    return cidr;
  }

  /**
   * Check if an IP is in a list of ranges
   */
  static isInRanges(ipAddress: string, ranges: IPRange[]): boolean {
    return ranges.some(range => {
      try {
        return ip.cidrSubnet(range.cidr).contains(ipAddress);
      } catch {
        return false;
      }
    });
  }

  /**
   * Find which range an IP belongs to
   */
  static findIPRange(ipAddress: string): IPRange | undefined {
    const version = isIP(ipAddress) as 4 | 6;
    const allRanges = [...this.PRIVATE_RANGES, ...this.RESERVED_RANGES];

    // Filter ranges to match IP version
    const relevantRanges = allRanges.filter(range => {
      const isIPv4 = version === 4;
      const isRangeIPv4 = !range.cidr.includes(':');
      return isIPv4 === isRangeIPv4;
    });

    return relevantRanges.find(range => {
      try {
        return ip.cidrSubnet(range.cidr).contains(ipAddress);
      } catch {
        return false;
      }
    });
  }

  // Private helper methods

  private static isMulticast(ipAddress: string): boolean {
    const version = isIP(ipAddress);
    if (version === 4) {
      // IPv4 multicast: 224.0.0.0/4
      try {
        return ip.cidrSubnet('224.0.0.0/4').contains(ipAddress);
      } catch {
        return false;
      }
    } else if (version === 6) {
      // IPv6 multicast: ff00::/8
      return ipAddress.toLowerCase().startsWith('ff');
    }
    return false;
  }

  private static isBroadcast(ipAddress: string): boolean {
    return ipAddress === '255.255.255.255';
  }

  private static ipToBinary(ipAddress: string): string {
    return ipAddress
      .split('.')
      .map(octet => parseInt(octet, 10).toString(2).padStart(8, '0'))
      .join('.');
  }

  private static ipToDecimal(ipAddress: string): number {
    return (
      ipAddress.split('.').reduce((acc, octet, index) => acc + (parseInt(octet, 10) << (8 * (3 - index))), 0) >>> 0
    );
  }

  private static getSubnet(ipAddress: string): string {
    // Default to /24 for demonstration
    try {
      const subnet = ip.subnet(ipAddress, '255.255.255.0');
      return subnet.networkAddress;
    } catch {
      return 'Unknown';
    }
  }

  private static getCIDR(ipAddress: string): string {
    // Default to /24 for demonstration
    try {
      const subnet = ip.subnet(ipAddress, '255.255.255.0');
      return `${subnet.networkAddress}/${subnet.subnetMaskLength}`;
    } catch {
      return 'Unknown';
    }
  }

  private static getIPv6Subnet(ipAddress: string): string {
    // IPv6 subnet calculation (simplified)
    const parts = ipAddress.split(':');
    if (parts.length >= 4) {
      return parts.slice(0, 4).join(':') + '::';
    }
    return 'Unknown';
  }

  private static getIPv6CIDR(ipAddress: string): string {
    // Default to /64 for IPv6
    const subnet = this.getIPv6Subnet(ipAddress);
    return subnet !== 'Unknown' ? `${subnet}/64` : 'Unknown';
  }
}
