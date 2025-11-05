export const handler = async (event: any) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: 'Test function works',
      event: {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: event.headers
      }
    })
  };
};
