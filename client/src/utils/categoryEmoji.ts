export function getCategoryEmoji(description: string): string {
  const d = description.toLowerCase();
  if (/food|dinner|lunch|breakfast|eat|restaurant|pizza|burger|biryani|meal|snack|chai|coffee|cafe/.test(d)) return 'food';
  if (/hotel|stay|hostel|airbnb|accommodation|room|rent/.test(d)) return 'hotel';
  if (/petrol|fuel|gas|diesel/.test(d)) return 'fuel';
  if (/flight|airline|airport|travel|trip|tour|train|bus|cab|uber|ola|taxi|metro/.test(d)) return 'travel';
  if (/movie|cinema|film|theatre|show|concert|event|ticket/.test(d)) return 'movie';
  if (/grocery|groceries|vegetable|fruit|milk|bread|supermarket|market/.test(d)) return 'grocery';
  if (/drink|beer|wine|alcohol|bar|pub/.test(d)) return 'drink';
  if (/medicine|medical|doctor|hospital|pharmacy|health/.test(d)) return 'medical';
  if (/game|gaming|sport|cricket|football|gym|fitness/.test(d)) return 'sport';
  if (/gift|present|birthday|anniversary|party/.test(d)) return 'gift';
  if (/electricity|bill|water|internet|wifi|recharge|mobile/.test(d)) return 'bill';
  if (/book|course|study|education|school|college/.test(d)) return 'education';
  if (/shopping|clothes|dress|shoes|mall/.test(d)) return 'shopping';
  return 'other';
}

export function getCategoryIcon(description: string): string {
  const cat = getCategoryEmoji(description);
  const map: Record<string, string> = {
    food: '🍕', hotel: '🏨', fuel: '⛽', travel: '✈️',
    movie: '🎬', grocery: '🛒', drink: '🍺', medical: '💊',
    sport: '🏏', gift: '🎁', bill: '💡', education: '📚',
    shopping: '🛍️', other: '🧾',
  };
  return map[cat] || '🧾';
}
