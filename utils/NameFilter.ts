// 이름+성 조합에서 성이 없는 경우 이름 trim
export const formatCharacterName = (name: string, family?: string): string => {
  if (!family || family.trim() === "") {
    return name.trim();
  }
  return `${name.trim()} ${family.trim()}`;
};

