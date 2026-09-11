const iconesPorEquivalencia: Record<string, string> = {
  school: 'escola', ambulance: 'ambulancia', ubs: 'ubs', utiBedYear: 'uti',
  minimumWageYear: 'salario', basicBasket: 'cesta', bolsaFamiliaMonth: 'bolsa-familia',
};

export function arteEquivalencia(key: string) {
  return `equivalencia-${iconesPorEquivalencia[key] ?? 'dinheiro'}`;
}
