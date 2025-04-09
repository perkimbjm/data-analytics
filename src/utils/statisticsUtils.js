// src/utils/statisticsUtils.js

/**
 * Calculates data for a Q-Q plot comparing the sample to a normal distribution
 * @param {Array<number>} data - The sample data
 * @returns {Object} The Q-Q plot data
 */
export const calculateQQPlotData = (data) => {
    // Sort the data
    const sortedData = [...data].sort((a, b) => a - b);
    const n = sortedData.length;
    
    // Calculate mean and standard deviation
    const mean = sortedData.reduce((acc, val) => acc + val, 0) / n;
    const stdDev = Math.sqrt(
      sortedData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
    );
    
    // Generate theoretical quantiles from a standard normal distribution
    const theoreticalQuantiles = [];
    // Generate sample quantiles
    const sampleQuantiles = [];
    
    for (let i = 0; i < n; i++) {
      // Use Blom's formula for calculating plot positions
      const p = (i + 0.375) / (n + 0.25);
      
      // Calculate theoretical quantile
      // Approximation of the inverse of the standard normal CDF
      const z = approximateNormalQuantile(p);
      
      // Scale z to match our data distribution
      const theoreticalValue = z * stdDev + mean;
      
      theoreticalQuantiles.push(z);
      sampleQuantiles.push(sortedData[i]);
    }
    
    // Create reference line points
    const minTQ = Math.min(...theoreticalQuantiles);
    const maxTQ = Math.max(...theoreticalQuantiles);
    const minSQ = Math.min(...sampleQuantiles);
    const maxSQ = Math.max(...sampleQuantiles);
    
    const linePoints = [
      { x: minTQ, y: minSQ },
      { x: maxTQ, y: maxSQ }
    ];
    
    return {
      theoretical: theoreticalQuantiles,
      sample: sampleQuantiles,
      linePoints
    };
  };
  
  /**
   * Approximates the inverse of the standard normal CDF (quantile function)
   * @param {number} p - Probability (0 to 1)
   * @returns {number} Approximate standard normal quantile
   */
  const approximateNormalQuantile = (p) => {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    
    // Approximation of the inverse of the standard normal CDF
    // Abramowitz and Stegun approximation 26.2.23
    const a1 = -3.969683028665376;
    const a2 = 13.330274817663591;
    const a3 = -24.618545862746252;
    const a4 = 23.08336743743573;
    const a5 = -8.747825460851807;
    
    const b1 = -2.7115337832075;
    const b2 = 3.808428568513;
    const b3 = -0.3674363953472;
    const b4 = 0.17337820835;
    
    const c1 = 0.337475483;
    const c2 = 0.976169;
    const c3 = 0.16064;
    
    const t = p > 0.5 ? 1 - p : p;
    const sign = p > 0.5 ? 1 : -1;
    
    if (t <= 0) return sign * Infinity;
    
    const y = Math.sqrt(-2 * Math.log(t));
    const z = c1 + y * (c2 + y * c3);
    
    return sign * (y - z);
  };
  
  /**
   * Performs normality tests on data
   * @param {Array<number>} data - The sample data
   * @param {string} testType - The type of normality test
   * @param {number} alpha - The significance level
   * @returns {Object} The test results
   */
  export const performNormalityTest = (data, testType, alpha) => {
    // Sort the data
    const sortedData = [...data].sort((a, b) => a - b);
    const n = sortedData.length;
    
    // Calculate mean and standard deviation
    const mean = sortedData.reduce((acc, val) => acc + val, 0) / n;
    const stdDev = Math.sqrt(
      sortedData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
    );
    
    let testStatistic, pValue, testName;
    
    // Perform the selected test
    if (testType === 'shapiro-wilk') {
      // Shapiro-Wilk test
      testName = 'Shapiro-Wilk Test';
      const result = shapiroWilkTest(sortedData);
      testStatistic = result.W;
      pValue = result.pValue;
    } else if (testType === 'kolmogorov-smirnov') {
      // Kolmogorov-Smirnov test
      testName = 'Kolmogorov-Smirnov Test';
      const result = kolmogorovSmirnovTest(sortedData);
      testStatistic = result.D;
      pValue = result.pValue;
    } else if (testType === 'anderson-darling') {
      // Anderson-Darling test
      testName = 'Anderson-Darling Test';
      const result = andersonDarlingTest(sortedData);
      testStatistic = result.A2;
      pValue = result.pValue;
    } else {
      throw new Error(`Unknown test type: ${testType}`);
    }
    
    // Determine if the data is normal
    const isNormal = pValue > alpha;
    
    // Generate conclusion
    const conclusion = isNormal
      ? `Tidak cukup bukti menolak hipotesis nol (p > ${alpha}). Data kemungkinan mengikuti distribusi normal.`
      : `Menolak hipotesis nol (p < ${alpha}). Data kemungkinan tidak mengikuti distribusi normal.`;
    
    // Generate interpretation
    const interpretation = isNormal
      ? `${testName} mengindikasikan dataset ini memiliki distribusi normal pada level kepercayaan ${alpha}. Disarankan menggunakan metode statistik parametrik untuk analisis lebih lanjut data ini.`
      : `${testName} menunjukkan bahwa dataset ini menyimpang secara signifikan dari distribusi normal pada tingkat signifikansi ${alpha}. Pertimbangkan untuk menggunakan metode non-parametrik untuk analisis lebih lanjut, atau menerapkan transformasi data agar mendekati distribusi normal`;
    
    return {
      testName,
      statistic: testStatistic,
      pValue,
      isNormal,
      conclusion,
      interpretation
    };
  };
  
  /**
   * Performs the Shapiro-Wilk test for normality
   * @param {Array<number>} data - The sorted sample data
   * @returns {Object} The test statistic W and p-value
   */
  const shapiroWilkTest = (data) => {
    const n = data.length;
    
    // Approximation of Shapiro-Wilk test for n <= 50
    // This is a simplified version and may not be as accurate as the full algorithm
    
    // Calculate the Shapiro-Wilk coefficients
    // These are normally obtained from tables, but we'll use a simplified approach
    const a = []; // Coefficients
    for (let i = 0; i < Math.floor(n/2); i++) {
      // Approximate coefficients using the normal approximation
      const m = n - i - 1;
      const j = i + 1;
      const mi = approximateNormalQuantile((j - 0.375) / (n + 0.25));
      const mj = approximateNormalQuantile((m + 1 - 0.375) / (n + 0.25));
      a[i] = (mi - mj) / Math.sqrt(2 * (n + 1));
    }
    
    // Normalize the coefficients
    const sumSqA = a.reduce((acc, val) => acc + val * val, 0);
    const normalizedA = a.map(val => val / Math.sqrt(sumSqA));
    
    // Calculate the test statistic W
    let b = 0;
    for (let i = 0; i < Math.floor(n/2); i++) {
      b += normalizedA[i] * (data[n - i - 1] - data[i]);
    }
    
    const variance = data.reduce((acc, val) => {
      const dev = val - data.reduce((sum, v) => sum + v, 0) / n;
      return acc + dev * dev;
    }, 0) / (n - 1);
    
    const W = (b * b) / variance;
    
    // Calculate approximate p-value
    // This is a very rough approximation and should be replaced with a better method
    // Note: For accurate p-values, use a statistical library
    let pValue;
    
    // Very rough approximation of p-value
    if (n <= 20) {
      // Small sample approximation
      const lnW = Math.log(1 - W);
      const mu = -1.5861 - 0.31082 * Math.log(n) - 0.083751 * Math.log(n) * Math.log(n);
      const sigma = 0.08904 - 0.038 * Math.log(n) + 0.00391 * Math.log(n) * Math.log(n);
      const z = (lnW - mu) / sigma;
      
      // Convert z to p-value using normal approximation
      pValue = 1 - normalCDF(z);
    } else {
      // Larger sample approximation
      const y = (1 - W) * n;
      let m, s;
      
      // Parameters from approximation tables
      if (n <= 50) {
        m = 0.784 + 0.100 * Math.log(n);
        s = 0.192 - 0.030 * Math.log(n);
      } else {
        m = 0.715 + 0.118 * Math.log(n);
        s = 0.176 - 0.026 * Math.log(n);
      }
      
      const z = (Math.log(y) - m) / s;
      pValue = 1 - normalCDF(z);
    }
    
    return { W, pValue };
  };
  
  /**
   * Performs the Kolmogorov-Smirnov test for normality
   * @param {Array<number>} data - The sorted sample data
   * @returns {Object} The test statistic D and p-value
   */
  const kolmogorovSmirnovTest = (data) => {
    const n = data.length;
    
    // Calculate mean and standard deviation
    const mean = data.reduce((acc, val) => acc + val, 0) / n;
    const stdDev = Math.sqrt(
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
    );
    
    // Calculate the empirical and theoretical CDFs
    let maxDiff = 0;
    for (let i = 0; i < n; i++) {
      // Empirical CDF: (i+1)/n
      const ecdf = (i + 1) / n;
      
      // Theoretical CDF: normal CDF with mean and stdDev
      const z = (data[i] - mean) / stdDev;
      const tcdf = normalCDF(z);
      
      // Calculate absolute difference
      const diff = Math.abs(ecdf - tcdf);
      if (diff > maxDiff) {
        maxDiff = diff;
      }
    }
    
    // The test statistic D is the maximum difference
    const D = maxDiff;
    
    // Calculate approximate p-value
    // This is the Lilliefors approximation for when testing against a normal distribution
    // with estimated parameters
    let pValue;
    
    if (n <= 100) {
      // Approximation for small sample sizes
      // Based on Monte Carlo simulations
      const a = 0.09037 * Math.pow(n, 0.4) + 0.01515 * Math.pow(n, 0.8) + 0.25197;
      const b = 1.2937 * Math.pow(n, 0.4) + 0.04956 * Math.pow(n, 0.8) - 0.2011;
      
      pValue = Math.exp(-Math.pow(D * a - b, 2));
    } else {
      // Asymptotic approximation for large sample sizes
      const z = D * Math.sqrt(n);
      pValue = 2 * Math.exp(-2 * z * z);
    }
    
    return { D, pValue };
  };
  
  /**
   * Performs the Anderson-Darling test for normality
   * @param {Array<number>} data - The sorted sample data
   * @returns {Object} The test statistic A² and p-value
   */
  const andersonDarlingTest = (data) => {
    const n = data.length;
    
    // Calculate mean and standard deviation
    const mean = data.reduce((acc, val) => acc + val, 0) / n;
    const stdDev = Math.sqrt(
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n
    );
    
    // Calculate the Anderson-Darling statistic
    let S = 0;
    for (let i = 0; i < n; i++) {
      // Standardize the data
      const z = (data[i] - mean) / stdDev;
      
      // Calculate CDF for the standardized value
      const cdf = normalCDF(z);
      
      // Calculate CDF for the complement
      const cdfComp = normalCDF(-(data[n - i - 1] - mean) / stdDev);
      
      // Calculate the summation term
      const term = (2 * i + 1) * (Math.log(cdf) + Math.log(1 - cdfComp));
      S += term;
    }
    
    // Calculate the A² statistic
    const A2 = -n - (1/n) * S;
    
    // Apply small sample correction
    const A2Star = A2 * (1 + 0.75/n + 2.25/(n*n));
    
    // Calculate p-value using approximation
    let pValue;
    
    if (A2Star <= 0.2) {
      pValue = 1 - Math.exp(-13.436 + 101.14 * A2Star - 223.73 * A2Star * A2Star);
    } else if (A2Star <= 0.34) {
      pValue = 1 - Math.exp(-8.318 + 42.796 * A2Star - 59.938 * A2Star * A2Star);
    } else if (A2Star <= 0.6) {
      pValue = Math.exp(0.9177 - 4.279 * A2Star - 1.38 * A2Star * A2Star);
    } else if (A2Star <= 10) {
      pValue = Math.exp(1.2937 - 5.709 * A2Star + 0.0186 * A2Star * A2Star);
    } else {
      pValue = 3.7e-24;
    }
    
    return { A2: A2Star, pValue };
  };
  
  /**
   * Calculates the standard normal CDF (Cumulative Distribution Function)
   * @param {number} z - The z-score
   * @returns {number} The probability
   */
  const normalCDF = (z) => {
    // Use the error function (erf) approximation
    // CDF(z) = 0.5 * (1 + erf(z / sqrt(2)))
    return 0.5 * (1 + approximateErf(z / Math.sqrt(2)));
  };
  
  /**
   * Approximates the error function (erf)
   * @param {number} x - The input value
   * @returns {number} The approximate erf value
   */
  const approximateErf = (x) => {
    // Constants
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    // Save the sign
    const sign = x < 0 ? -1 : 1;
    const absX = Math.abs(x);
    
    // Abramowitz and Stegun approximation (formula 7.1.26)
    const t = 1.0 / (1.0 + p * absX);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
    
    return sign * y;
  };