// Simple sparkline SVG generator

export interface SparklinePoint {
  x: number
  y: number
}

export function generateSparklinePath(
  data: number[],
  width: number = 60,
  height: number = 20,
  padding: number = 2
): string {
  if (data.length < 2) return ''
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  
  const points: SparklinePoint[] = data.map((value, index) => ({
    x: padding + (index * (width - 2 * padding)) / (data.length - 1),
    y: padding + ((max - value) * (height - 2 * padding)) / range
  }))
  
  const pathData = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L'
      return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    })
    .join(' ')
  
  return pathData
}

export function generateSparklineData(
  basePrice: number,
  length: number = 30,
  volatility: number = 0.02
): number[] {
  const data = [basePrice]
  
  for (let i = 1; i < length; i++) {
    const change = (Math.random() - 0.5) * 2 * volatility
    const newPrice = data[i - 1] * (1 + change)
    data.push(newPrice)
  }
  
  return data
}
