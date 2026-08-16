export function getTrackingUrl(courier: string, awb: string | number) {
  const code = String(awb);

  switch (courier.toLowerCase()) {
    case "blue dart":
    case "bluedart":
      return `https://www.bluedart.com/tracking?trackingNumber=${code}`;

    case "delhivery":
      return `https://www.delhivery.com/track/package/${code}`;

    case "dtdc":
      return `https://www.dtdc.in/tracking/tracking_results.asp?Ttype=awb&strCnno=${code}`;

    default:
      return null;
  }
}