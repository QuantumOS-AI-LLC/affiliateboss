export default function handler(req, res) {
  const { code } = req.query;
  
  // Demo redirect mapping
  const redirects = {
    'mbp001': 'https://apple.com/macbook-pro',
    'tesla02': 'https://tesla.com/models',
    'ip15pm': 'https://apple.com/iphone-15-pro',
    'sony01': 'https://sony.com/headphones/wh-1000xm5',
    'canr5': 'https://canon.com/cameras/eos-r5'
  };
  
  const targetUrl = redirects[code];
  
  if (targetUrl) {
    res.writeHead(302, { Location: targetUrl });
    res.end();
  } else {
    res.status(404).json({ error: 'Link not found' });
  }
}