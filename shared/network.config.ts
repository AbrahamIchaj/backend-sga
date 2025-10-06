export const networkConfig = {
  protocol: 'http',
  host: '192.88.1.122',
  backendPort: 3000,
  frontendPort: 4200,
};

export const backendBaseUrl = `${networkConfig.protocol}://${networkConfig.host}:${networkConfig.backendPort}`;
export const frontendBaseUrl = `${networkConfig.protocol}://${networkConfig.host}:${networkConfig.frontendPort}`;

export const apiBaseUrl = `${backendBaseUrl}/api/v1`;
