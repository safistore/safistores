export default function handler(request, response) {
  response.status(200).json({
    status: 'online',
    message: 'Safi Store API is fully operational',
    timestamp: new Date().toISOString(),
    store: 'Safi Store (Nish Fashion)'
  });
}
