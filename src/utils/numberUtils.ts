 // Number conversion utilities for Arabic and English numbers

// Arabic to English number mapping
const arabicToEnglish: { [key: string]: string } = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
}

// English to Arabic number mapping
const englishToArabic: { [key: string]: string } = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩'
}

/**
 * Convert Arabic numbers to English numbers
 * @param text - Text containing Arabic numbers
 * @returns Text with English numbers
 */
export const convertArabicToEnglish = (text: string): string => {
  if (!text) return text
  
  return text.replace(/[٠-٩]/g, (match) => {
    return arabicToEnglish[match] || match
  })
}

/**
 * Convert English numbers to Arabic numbers
 * @param text - Text containing English numbers
 * @returns Text with Arabic numbers
 */
export const convertEnglishToArabic = (text: string): string => {
  if (!text) return text
  
  return text.replace(/[0-9]/g, (match) => {
    return englishToArabic[match] || match
  })
}

/**
 * Parse a number from text (handles both Arabic and English)
 * @param text - Text containing numbers
 * @returns Parsed number or NaN if invalid
 */
export const parseNumber = (text: string): number => {
  if (!text) return NaN
  
  // Convert Arabic to English first
  const englishText = convertArabicToEnglish(text.toString())
  
  // Remove any non-numeric characters except decimal point
  const cleanText = englishText.replace(/[^\d.-]/g, '')
  
  return parseFloat(cleanText)
}

/**
 * Format a number to Arabic numerals
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number as string with Arabic numerals
 */
export const formatToArabic = (num: number, decimals: number = 2): string => {
  if (isNaN(num)) return '٠'
  
  const formatted = num.toFixed(decimals)
  return convertEnglishToArabic(formatted)
}

/**
 * Format a number to English numerals
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number as string with English numerals
 */
export const formatToEnglish = (num: number, decimals: number = 2): string => {
  if (isNaN(num)) return '0'
  
  return num.toFixed(decimals)
}

/**
 * Format currency in Arabic
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: 'ريال')
 * @returns Formatted currency string
 */
export const formatCurrencyArabic = (amount: number, currency: string = 'ريال'): string => {
  const formatted = formatToArabic(amount)
  return `${formatted} ${currency}`
}

/**
 * Format currency in English
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: 'SAR')
 * @returns Formatted currency string
 */
export const formatCurrencyEnglish = (amount: number, currency: string = 'SAR'): string => {
  const formatted = formatToEnglish(amount)
  return `${formatted} ${currency}`
}

/**
 * Validate if input contains only valid numbers (Arabic or English)
 * @param input - Input to validate
 * @returns True if valid number input
 */
export const isValidNumberInput = (input: string): boolean => {
  if (!input) return true // Empty input is valid
  
  // Convert Arabic to English and check if it's a valid number
  const englishInput = convertArabicToEnglish(input)
  const cleanInput = englishInput.replace(/[^\d.-]/g, '')
  
  return !isNaN(parseFloat(cleanInput)) && isFinite(parseFloat(cleanInput))
}

/**
 * Clean number input (remove non-numeric characters except decimal point)
 * @param input - Input to clean
 * @returns Cleaned number string
 */
export const cleanNumberInput = (input: string): string => {
  if (!input) return ''
  
  // Convert Arabic to English first
  const englishInput = convertArabicToEnglish(input)
  
  // Remove any non-numeric characters except decimal point
  return englishInput.replace(/[^\d.-]/g, '')
}

/**
 * Format phone number to Arabic numerals
 * @param phone - Phone number
 * @returns Phone number with Arabic numerals
 */
export const formatPhoneArabic = (phone: string): string => {
  if (!phone) return ''
  
  return convertEnglishToArabic(phone)
}

/**
 * Format phone number to English numerals
 * @param phone - Phone number
 * @returns Phone number with English numerals
 */
export const formatPhoneEnglish = (phone: string): string => {
  if (!phone) return ''
  
  return convertArabicToEnglish(phone)
}
