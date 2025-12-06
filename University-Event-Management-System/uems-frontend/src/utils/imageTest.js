// src/utils/imageTest.js
export const testImageUrl = async (imagePath) => {
  if (!imagePath) return { valid: false, error: 'No path provided' };
  
  const fullUrl = `http://localhost:5000${imagePath}`;
  console.log('Testing image URL:', fullUrl);
  
  try {
    const response = await fetch(fullUrl, { method: 'HEAD' });
    console.log('Image test response:', {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });
    
    return {
      valid: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type'),
      url: fullUrl
    };
  } catch (error) {
    console.error('Image test failed:', error);
    return {
      valid: false,
      error: error.message,
      url: fullUrl
    };
  }
};

// Add to EventDetails.jsx in loadEventDetails:
const testAllImages = async (eventData) => {
  const imagesToTest = [];
  if (eventData.bannerImage) imagesToTest.push(eventData.bannerImage);
  if (eventData.images) imagesToTest.push(...eventData.images.map(img => img.url));
  
  for (const imgUrl of imagesToTest) {
    const result = await testImageUrl(imgUrl);
    console.log(`Image test for ${imgUrl}:`, result);
  }
};