/**
 * Fast script to populate nearestCity for grid points using a local cities database.
 * Uses Haversine formula to find the nearest city to each grid point.
 *
 * This approach is much faster than reverse geocoding APIs since it runs entirely locally.
 *
 * Usage: npx tsx scripts/populate-cities-fast.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Major US cities dataset with lat/lon
// Source: Compiled from US Census Bureau data (cities with population > 10,000)
// This is a representative subset - in production, you'd use a more complete dataset
const US_CITIES: Array<{ name: string; state: string; lat: number; lon: number }> = [
  // Alabama
  { name: 'Birmingham', state: 'AL', lat: 33.5207, lon: -86.8025 },
  { name: 'Montgomery', state: 'AL', lat: 32.3792, lon: -86.3077 },
  { name: 'Mobile', state: 'AL', lat: 30.6954, lon: -88.0399 },
  { name: 'Huntsville', state: 'AL', lat: 34.7304, lon: -86.5861 },

  // Arizona
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.074 },
  { name: 'Tucson', state: 'AZ', lat: 32.2226, lon: -110.9747 },
  { name: 'Mesa', state: 'AZ', lat: 33.4152, lon: -111.8315 },
  { name: 'Flagstaff', state: 'AZ', lat: 35.1983, lon: -111.6513 },
  { name: 'Yuma', state: 'AZ', lat: 32.6927, lon: -114.6277 },

  // Arkansas
  { name: 'Little Rock', state: 'AR', lat: 34.7465, lon: -92.2896 },
  { name: 'Fort Smith', state: 'AR', lat: 35.3859, lon: -94.3985 },
  { name: 'Fayetteville', state: 'AR', lat: 36.0626, lon: -94.1574 },

  // California
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
  { name: 'San Jose', state: 'CA', lat: 37.3382, lon: -121.8863 },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
  { name: 'Fresno', state: 'CA', lat: 36.7378, lon: -119.7871 },
  { name: 'Sacramento', state: 'CA', lat: 38.5816, lon: -121.4944 },
  { name: 'Oakland', state: 'CA', lat: 37.8044, lon: -122.2712 },
  { name: 'Bakersfield', state: 'CA', lat: 35.3733, lon: -119.0187 },
  { name: 'Riverside', state: 'CA', lat: 33.9533, lon: -117.3962 },
  { name: 'Stockton', state: 'CA', lat: 37.9577, lon: -121.2908 },
  { name: 'Redding', state: 'CA', lat: 40.5865, lon: -122.3917 },
  { name: 'Eureka', state: 'CA', lat: 40.8021, lon: -124.1637 },
  { name: 'Palm Springs', state: 'CA', lat: 33.8303, lon: -116.5453 },

  // Colorado
  { name: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { name: 'Colorado Springs', state: 'CO', lat: 38.8339, lon: -104.8214 },
  { name: 'Aurora', state: 'CO', lat: 39.7294, lon: -104.8319 },
  { name: 'Fort Collins', state: 'CO', lat: 40.5853, lon: -105.0844 },
  { name: 'Grand Junction', state: 'CO', lat: 39.0639, lon: -108.5506 },
  { name: 'Durango', state: 'CO', lat: 37.2753, lon: -107.8801 },

  // Connecticut
  { name: 'Bridgeport', state: 'CT', lat: 41.1865, lon: -73.1952 },
  { name: 'New Haven', state: 'CT', lat: 41.3083, lon: -72.9279 },
  { name: 'Hartford', state: 'CT', lat: 41.7658, lon: -72.6734 },

  // Delaware
  { name: 'Wilmington', state: 'DE', lat: 39.7391, lon: -75.5398 },
  { name: 'Dover', state: 'DE', lat: 39.1582, lon: -75.5244 },

  // Florida
  { name: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557 },
  { name: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
  { name: 'Tampa', state: 'FL', lat: 27.9506, lon: -82.4572 },
  { name: 'Orlando', state: 'FL', lat: 28.5383, lon: -81.3792 },
  { name: 'St. Petersburg', state: 'FL', lat: 27.7676, lon: -82.6403 },
  { name: 'Tallahassee', state: 'FL', lat: 30.4383, lon: -84.2807 },
  { name: 'Fort Lauderdale', state: 'FL', lat: 26.1224, lon: -80.1373 },
  { name: 'Pensacola', state: 'FL', lat: 30.4213, lon: -87.2169 },
  { name: 'Key West', state: 'FL', lat: 24.5551, lon: -81.78 },

  // Georgia
  { name: 'Atlanta', state: 'GA', lat: 33.749, lon: -84.388 },
  { name: 'Augusta', state: 'GA', lat: 33.4735, lon: -82.0105 },
  { name: 'Columbus', state: 'GA', lat: 32.4609, lon: -84.9877 },
  { name: 'Savannah', state: 'GA', lat: 32.0809, lon: -81.0912 },
  { name: 'Macon', state: 'GA', lat: 32.8407, lon: -83.6324 },

  // Idaho
  { name: 'Boise', state: 'ID', lat: 43.615, lon: -116.2023 },
  { name: 'Meridian', state: 'ID', lat: 43.6121, lon: -116.3915 },
  { name: 'Idaho Falls', state: 'ID', lat: 43.4917, lon: -112.034 },
  { name: 'Pocatello', state: 'ID', lat: 42.8713, lon: -112.4455 },
  { name: 'Coeur d\'Alene', state: 'ID', lat: 47.6777, lon: -116.7805 },

  // Illinois
  { name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
  { name: 'Aurora', state: 'IL', lat: 41.7606, lon: -88.3201 },
  { name: 'Rockford', state: 'IL', lat: 42.2711, lon: -89.094 },
  { name: 'Springfield', state: 'IL', lat: 39.7817, lon: -89.6501 },
  { name: 'Peoria', state: 'IL', lat: 40.6936, lon: -89.589 },

  // Indiana
  { name: 'Indianapolis', state: 'IN', lat: 39.7684, lon: -86.1581 },
  { name: 'Fort Wayne', state: 'IN', lat: 41.0793, lon: -85.1394 },
  { name: 'Evansville', state: 'IN', lat: 37.9716, lon: -87.5711 },
  { name: 'South Bend', state: 'IN', lat: 41.6834, lon: -86.2501 },

  // Iowa
  { name: 'Des Moines', state: 'IA', lat: 41.5868, lon: -93.625 },
  { name: 'Cedar Rapids', state: 'IA', lat: 41.9779, lon: -91.6656 },
  { name: 'Davenport', state: 'IA', lat: 41.5236, lon: -90.5776 },
  { name: 'Sioux City', state: 'IA', lat: 42.4963, lon: -96.4049 },

  // Kansas
  { name: 'Wichita', state: 'KS', lat: 37.6872, lon: -97.3301 },
  { name: 'Overland Park', state: 'KS', lat: 38.9822, lon: -94.6708 },
  { name: 'Kansas City', state: 'KS', lat: 39.1155, lon: -94.6268 },
  { name: 'Topeka', state: 'KS', lat: 39.0558, lon: -95.6894 },

  // Kentucky
  { name: 'Louisville', state: 'KY', lat: 38.2527, lon: -85.7585 },
  { name: 'Lexington', state: 'KY', lat: 38.0406, lon: -84.5037 },
  { name: 'Bowling Green', state: 'KY', lat: 36.9685, lon: -86.4808 },

  // Louisiana
  { name: 'New Orleans', state: 'LA', lat: 29.9511, lon: -90.0715 },
  { name: 'Baton Rouge', state: 'LA', lat: 30.4515, lon: -91.1871 },
  { name: 'Shreveport', state: 'LA', lat: 32.5252, lon: -93.7502 },
  { name: 'Lafayette', state: 'LA', lat: 30.2241, lon: -92.0198 },

  // Maine
  { name: 'Portland', state: 'ME', lat: 43.6591, lon: -70.2568 },
  { name: 'Lewiston', state: 'ME', lat: 44.1004, lon: -70.2148 },
  { name: 'Bangor', state: 'ME', lat: 44.8016, lon: -68.7712 },

  // Maryland
  { name: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122 },
  { name: 'Frederick', state: 'MD', lat: 39.4143, lon: -77.4105 },
  { name: 'Rockville', state: 'MD', lat: 39.084, lon: -77.1528 },

  // Massachusetts
  { name: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
  { name: 'Worcester', state: 'MA', lat: 42.2626, lon: -71.8023 },
  { name: 'Springfield', state: 'MA', lat: 42.1015, lon: -72.5898 },
  { name: 'Cambridge', state: 'MA', lat: 42.3736, lon: -71.1097 },

  // Michigan
  { name: 'Detroit', state: 'MI', lat: 42.3314, lon: -83.0458 },
  { name: 'Grand Rapids', state: 'MI', lat: 42.9634, lon: -85.6681 },
  { name: 'Warren', state: 'MI', lat: 42.5145, lon: -83.0147 },
  { name: 'Lansing', state: 'MI', lat: 42.7325, lon: -84.5555 },
  { name: 'Traverse City', state: 'MI', lat: 44.7631, lon: -85.6206 },
  { name: 'Marquette', state: 'MI', lat: 46.5436, lon: -87.3954 },

  // Minnesota
  { name: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.265 },
  { name: 'Saint Paul', state: 'MN', lat: 44.9537, lon: -93.09 },
  { name: 'Rochester', state: 'MN', lat: 44.0121, lon: -92.4802 },
  { name: 'Duluth', state: 'MN', lat: 46.7867, lon: -92.1005 },

  // Mississippi
  { name: 'Jackson', state: 'MS', lat: 32.2988, lon: -90.1848 },
  { name: 'Gulfport', state: 'MS', lat: 30.3674, lon: -89.0928 },
  { name: 'Southaven', state: 'MS', lat: 34.9889, lon: -90.0126 },

  // Missouri
  { name: 'Kansas City', state: 'MO', lat: 39.0997, lon: -94.5786 },
  { name: 'Saint Louis', state: 'MO', lat: 38.627, lon: -90.1994 },
  { name: 'Springfield', state: 'MO', lat: 37.2089, lon: -93.2923 },
  { name: 'Columbia', state: 'MO', lat: 38.9517, lon: -92.3341 },

  // Montana
  { name: 'Billings', state: 'MT', lat: 45.7833, lon: -108.5007 },
  { name: 'Missoula', state: 'MT', lat: 46.8721, lon: -114.0 },
  { name: 'Great Falls', state: 'MT', lat: 47.5053, lon: -111.3008 },
  { name: 'Bozeman', state: 'MT', lat: 45.6769, lon: -111.0429 },
  { name: 'Helena', state: 'MT', lat: 46.5891, lon: -112.0391 },

  // Nebraska
  { name: 'Omaha', state: 'NE', lat: 41.2565, lon: -95.9345 },
  { name: 'Lincoln', state: 'NE', lat: 40.8258, lon: -96.6852 },
  { name: 'Grand Island', state: 'NE', lat: 40.925, lon: -98.342 },
  { name: 'North Platte', state: 'NE', lat: 41.1403, lon: -100.7601 },

  // Nevada
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
  { name: 'Henderson', state: 'NV', lat: 36.0395, lon: -114.9817 },
  { name: 'Reno', state: 'NV', lat: 39.5296, lon: -119.8138 },
  { name: 'Elko', state: 'NV', lat: 40.8324, lon: -115.7631 },

  // New Hampshire
  { name: 'Manchester', state: 'NH', lat: 42.9956, lon: -71.4548 },
  { name: 'Nashua', state: 'NH', lat: 42.7654, lon: -71.4676 },
  { name: 'Concord', state: 'NH', lat: 43.2081, lon: -71.5376 },

  // New Jersey
  { name: 'Newark', state: 'NJ', lat: 40.7357, lon: -74.1724 },
  { name: 'Jersey City', state: 'NJ', lat: 40.7282, lon: -74.0776 },
  { name: 'Paterson', state: 'NJ', lat: 40.9168, lon: -74.1718 },
  { name: 'Trenton', state: 'NJ', lat: 40.2206, lon: -74.7597 },
  { name: 'Atlantic City', state: 'NJ', lat: 39.3643, lon: -74.4229 },

  // New Mexico
  { name: 'Albuquerque', state: 'NM', lat: 35.0844, lon: -106.6504 },
  { name: 'Las Cruces', state: 'NM', lat: 32.3199, lon: -106.7637 },
  { name: 'Santa Fe', state: 'NM', lat: 35.687, lon: -105.9378 },
  { name: 'Roswell', state: 'NM', lat: 33.3943, lon: -104.5228 },

  // New York
  { name: 'New York City', state: 'NY', lat: 40.7128, lon: -74.006 },
  { name: 'Buffalo', state: 'NY', lat: 42.8864, lon: -78.8784 },
  { name: 'Rochester', state: 'NY', lat: 43.1566, lon: -77.6088 },
  { name: 'Syracuse', state: 'NY', lat: 43.0481, lon: -76.1474 },
  { name: 'Albany', state: 'NY', lat: 42.6526, lon: -73.7562 },

  // North Carolina
  { name: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
  { name: 'Raleigh', state: 'NC', lat: 35.7796, lon: -78.6382 },
  { name: 'Greensboro', state: 'NC', lat: 36.0726, lon: -79.792 },
  { name: 'Durham', state: 'NC', lat: 35.994, lon: -78.8986 },
  { name: 'Wilmington', state: 'NC', lat: 34.2257, lon: -77.9447 },
  { name: 'Asheville', state: 'NC', lat: 35.5951, lon: -82.5515 },

  // North Dakota
  { name: 'Fargo', state: 'ND', lat: 46.8772, lon: -96.7898 },
  { name: 'Bismarck', state: 'ND', lat: 46.8083, lon: -100.7837 },
  { name: 'Grand Forks', state: 'ND', lat: 47.9253, lon: -97.0329 },
  { name: 'Minot', state: 'ND', lat: 48.2325, lon: -101.2963 },

  // Ohio
  { name: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
  { name: 'Cleveland', state: 'OH', lat: 41.4993, lon: -81.6944 },
  { name: 'Cincinnati', state: 'OH', lat: 39.1031, lon: -84.512 },
  { name: 'Toledo', state: 'OH', lat: 41.6528, lon: -83.5379 },
  { name: 'Akron', state: 'OH', lat: 41.0814, lon: -81.519 },

  // Oklahoma
  { name: 'Oklahoma City', state: 'OK', lat: 35.4676, lon: -97.5164 },
  { name: 'Tulsa', state: 'OK', lat: 36.154, lon: -95.9928 },
  { name: 'Norman', state: 'OK', lat: 35.2226, lon: -97.4395 },
  { name: 'Lawton', state: 'OK', lat: 34.6036, lon: -98.3959 },

  // Oregon
  { name: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
  { name: 'Salem', state: 'OR', lat: 44.9429, lon: -123.0351 },
  { name: 'Eugene', state: 'OR', lat: 44.0521, lon: -123.0868 },
  { name: 'Bend', state: 'OR', lat: 44.0582, lon: -121.3153 },
  { name: 'Medford', state: 'OR', lat: 42.3265, lon: -122.8756 },

  // Pennsylvania
  { name: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
  { name: 'Pittsburgh', state: 'PA', lat: 40.4406, lon: -79.9959 },
  { name: 'Allentown', state: 'PA', lat: 40.6084, lon: -75.4902 },
  { name: 'Erie', state: 'PA', lat: 42.1292, lon: -80.0851 },
  { name: 'Harrisburg', state: 'PA', lat: 40.2732, lon: -76.8867 },

  // Rhode Island
  { name: 'Providence', state: 'RI', lat: 41.824, lon: -71.4128 },
  { name: 'Warwick', state: 'RI', lat: 41.7001, lon: -71.4162 },

  // South Carolina
  { name: 'Charleston', state: 'SC', lat: 32.7765, lon: -79.9311 },
  { name: 'Columbia', state: 'SC', lat: 34.0007, lon: -81.0348 },
  { name: 'Greenville', state: 'SC', lat: 34.8526, lon: -82.394 },
  { name: 'Myrtle Beach', state: 'SC', lat: 33.6891, lon: -78.8867 },

  // South Dakota
  { name: 'Sioux Falls', state: 'SD', lat: 43.5446, lon: -96.7311 },
  { name: 'Rapid City', state: 'SD', lat: 44.0805, lon: -103.231 },
  { name: 'Aberdeen', state: 'SD', lat: 45.4647, lon: -98.4865 },

  // Tennessee
  { name: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 },
  { name: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.049 },
  { name: 'Knoxville', state: 'TN', lat: 35.9606, lon: -83.9207 },
  { name: 'Chattanooga', state: 'TN', lat: 35.0456, lon: -85.3097 },

  // Texas
  { name: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
  { name: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
  { name: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.797 },
  { name: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { name: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
  { name: 'El Paso', state: 'TX', lat: 31.7619, lon: -106.485 },
  { name: 'Corpus Christi', state: 'TX', lat: 27.8006, lon: -97.3964 },
  { name: 'Lubbock', state: 'TX', lat: 33.5779, lon: -101.8552 },
  { name: 'Amarillo', state: 'TX', lat: 35.2219, lon: -101.8313 },
  { name: 'Midland', state: 'TX', lat: 31.9973, lon: -102.0779 },
  { name: 'Brownsville', state: 'TX', lat: 25.9017, lon: -97.4975 },
  { name: 'McAllen', state: 'TX', lat: 26.2034, lon: -98.2300 },
  { name: 'Laredo', state: 'TX', lat: 27.5306, lon: -99.4803 },

  // Utah
  { name: 'Salt Lake City', state: 'UT', lat: 40.7608, lon: -111.891 },
  { name: 'West Valley City', state: 'UT', lat: 40.6916, lon: -112.0011 },
  { name: 'Provo', state: 'UT', lat: 40.2338, lon: -111.6585 },
  { name: 'St. George', state: 'UT', lat: 37.0965, lon: -113.5684 },
  { name: 'Moab', state: 'UT', lat: 38.5733, lon: -109.5498 },

  // Vermont
  { name: 'Burlington', state: 'VT', lat: 44.4759, lon: -73.2121 },
  { name: 'Montpelier', state: 'VT', lat: 44.2601, lon: -72.5754 },

  // Virginia
  { name: 'Virginia Beach', state: 'VA', lat: 36.8529, lon: -75.978 },
  { name: 'Norfolk', state: 'VA', lat: 36.8508, lon: -76.2859 },
  { name: 'Chesapeake', state: 'VA', lat: 36.7682, lon: -76.2875 },
  { name: 'Richmond', state: 'VA', lat: 37.5407, lon: -77.436 },
  { name: 'Roanoke', state: 'VA', lat: 37.2709, lon: -79.9414 },

  // Washington
  { name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { name: 'Spokane', state: 'WA', lat: 47.6588, lon: -117.426 },
  { name: 'Tacoma', state: 'WA', lat: 47.2529, lon: -122.4443 },
  { name: 'Vancouver', state: 'WA', lat: 45.6387, lon: -122.6615 },
  { name: 'Bellingham', state: 'WA', lat: 48.7519, lon: -122.4787 },
  { name: 'Olympia', state: 'WA', lat: 47.0379, lon: -122.9007 },

  // West Virginia
  { name: 'Charleston', state: 'WV', lat: 38.3498, lon: -81.6326 },
  { name: 'Huntington', state: 'WV', lat: 38.4192, lon: -82.4452 },
  { name: 'Morgantown', state: 'WV', lat: 39.6295, lon: -79.9559 },

  // Wisconsin
  { name: 'Milwaukee', state: 'WI', lat: 43.0389, lon: -87.9065 },
  { name: 'Madison', state: 'WI', lat: 43.0731, lon: -89.4012 },
  { name: 'Green Bay', state: 'WI', lat: 44.5133, lon: -88.0133 },
  { name: 'La Crosse', state: 'WI', lat: 43.8014, lon: -91.2396 },
  { name: 'Eau Claire', state: 'WI', lat: 44.8113, lon: -91.4985 },

  // Wyoming
  { name: 'Cheyenne', state: 'WY', lat: 41.14, lon: -104.8202 },
  { name: 'Casper', state: 'WY', lat: 42.8666, lon: -106.3131 },
  { name: 'Laramie', state: 'WY', lat: 41.3114, lon: -105.5911 },
  { name: 'Jackson', state: 'WY', lat: 43.4799, lon: -110.7624 },
  { name: 'Sheridan', state: 'WY', lat: 44.7972, lon: -106.9561 },

  // Washington D.C.
  { name: 'Washington', state: 'DC', lat: 38.9072, lon: -77.0369 },
];

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find the nearest city to a given point
 */
function findNearestCity(
  lat: number,
  lon: number,
  state: string
): { name: string; distance: number } | null {
  let nearest: { name: string; distance: number } | null = null;

  // First try to find nearest city in the same state
  const sameStateCities = US_CITIES.filter(c => c.state === state);
  for (const city of sameStateCities) {
    const distance = haversineDistance(lat, lon, city.lat, city.lon);
    if (!nearest || distance < nearest.distance) {
      nearest = { name: city.name, distance };
    }
  }

  // If found a city within 100 miles in same state, use it
  if (nearest && nearest.distance < 100) {
    return nearest;
  }

  // Otherwise, check all cities and find the closest
  for (const city of US_CITIES) {
    const distance = haversineDistance(lat, lon, city.lat, city.lon);
    if (!nearest || distance < nearest.distance) {
      nearest = { name: `Near ${city.name}`, distance };
    }
  }

  return nearest;
}

/**
 * Main function
 */
async function main() {
  console.log('🏙️  Populating nearest cities (fast method)...\n');

  // Get all grid points without nearestCity
  const points = await prisma.gridPoint.findMany({
    where: { nearestCity: null },
    select: { id: true, latitude: true, longitude: true, state: true },
  });

  console.log(`📊 Found ${points.length} grid points without nearestCity`);

  if (points.length === 0) {
    console.log('✅ All grid points already have nearestCity!');
    return;
  }

  // Process all points
  let updated = 0;
  const BATCH_SIZE = 500;

  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);

    // Prepare updates
    const updates = batch.map(point => {
      const nearest = findNearestCity(point.latitude, point.longitude, point.state);
      return {
        id: point.id,
        nearestCity: nearest ? nearest.name : `${point.state} Area`,
      };
    });

    // Batch update using transaction
    await prisma.$transaction(
      updates.map(u =>
        prisma.gridPoint.update({
          where: { id: u.id },
          data: { nearestCity: u.nearestCity },
        })
      )
    );

    updated += batch.length;
    const progress = Math.round((updated / points.length) * 100);
    console.log(`📈 Progress: ${updated}/${points.length} (${progress}%)`);
  }

  console.log('\n✅ Nearest city population complete!');
  console.log(`📊 Updated: ${updated} grid points`);

  // Show sample results
  console.log('\n📋 Sample results:');
  const samples = await prisma.gridPoint.findMany({
    take: 10,
    select: { latitude: true, longitude: true, state: true, nearestCity: true },
  });
  for (const sample of samples) {
    console.log(
      `   ${sample.state} (${sample.latitude}, ${sample.longitude}) → ${sample.nearestCity}`
    );
  }
}

main()
  .catch(e => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
