export default (xmlString) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('invalidRSS');
  }
  
  const channel = xmlDoc.querySelector('channel');
  if (!channel) {
    throw new Error('invalidRSS');
  }
  
  const getText = (element, selector) => {
    const el = element.querySelector(selector);
    return el ? el.textContent.trim() : '';
  };
  
  const feed = {
    id: `feed-${Date.now()}`,
    title: getText(channel, 'title') || '',
    description: getText(channel, 'description') || '',
  };
  
  const items = xmlDoc.querySelectorAll('item');
  const posts = Array.from(items).map((item, index) => ({
    id: `post-${Date.now()}-${index}`,
    feedId: feed.id,
    title: getText(item, 'title') || '',
    link: getText(item, 'link') || '#',
    description: getText(item, 'description') || '',
  }));
  
  return { feed, posts };
};