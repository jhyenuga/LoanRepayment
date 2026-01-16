// Global variables
let tenureUnit = 'months';
let chart = null;

// DOM Elements
const principalInput = document.getElementById('principal');
const interestRateInput = document.getElementById('interestRate');
const tenureInput = document.getElementById('tenure');
const yearsBtn = document.getElementById('yearsBtn');
const monthsBtn = document.getElementById('monthsBtn');
const tenureLabel = document.getElementById('tenureLabel');
const enablePrepaymentCheckbox = document.getElementById('enablePrepayment');
const prepaymentInputs = document.getElementById('prepaymentInputs');
const prepaymentAmountInput = document.getElementById('prepaymentAmount');
const prepaymentMonthInput = document.getElementById('prepaymentMonth');
const calculateBtn = document.getElementById('calculateBtn');
const resetBtn = document.getElementById('resetBtn');
const resultsSection = document.getElementById('resultsSection');
const showScheduleBtn = document.getElementById('showScheduleBtn');
const scheduleTableContainer = document.getElementById('scheduleTableContainer');
const scheduleTableBody = document.getElementById('scheduleTableBody');
const prepaymentTypeRadios = document.querySelectorAll('input[name="prepaymentType"]');
const recurringOptions = document.getElementById('recurringOptions');
const prepaymentFrequencySelect = document.getElementById('prepaymentFrequency');

// Event Listeners
yearsBtn.addEventListener('click', () => toggleTenureUnit('years'));
monthsBtn.addEventListener('click', () => toggleTenureUnit('months'));
enablePrepaymentCheckbox.addEventListener('change', togglePrepayment);
prepaymentTypeRadios.forEach(radio => {
    radio.addEventListener('change', togglePrepaymentType);
});
calculateBtn.addEventListener('click', calculateEMI);
resetBtn.addEventListener('click', resetCalculator);
showScheduleBtn.addEventListener('click', toggleSchedule);

// Toggle tenure unit
function toggleTenureUnit(unit) {
    tenureUnit = unit;
    
    if (unit === 'years') {
        yearsBtn.classList.add('active');
        monthsBtn.classList.remove('active');
        tenureLabel.textContent = 'Years';
    } else {
        monthsBtn.classList.add('active');
        yearsBtn.classList.remove('active');
        tenureLabel.textContent = 'Months';
    }
}

// Toggle prepayment inputs
function togglePrepayment() {
    if (enablePrepaymentCheckbox.checked) {
        prepaymentInputs.style.display = 'block';
    } else {
        prepaymentInputs.style.display = 'none';
    }
}

// Toggle prepayment type
function togglePrepaymentType() {
    const selectedType = document.querySelector('input[name="prepaymentType"]:checked').value;
    if (selectedType === 'recurring') {
        recurringOptions.style.display = 'block';
    } else {
        recurringOptions.style.display = 'none';
    }
}

// Toggle schedule table
function toggleSchedule() {
    if (scheduleTableContainer.style.display === 'none') {
        scheduleTableContainer.style.display = 'block';
        showScheduleBtn.textContent = 'Hide Payment Schedule';
    } else {
        scheduleTableContainer.style.display = 'none';
        showScheduleBtn.textContent = 'Show Payment Schedule';
    }
}

// Calculate EMI
function calculateEMI() {
    const principal = parseFloat(principalInput.value);
    const annualRate = parseFloat(interestRateInput.value);
    const tenure = parseFloat(tenureInput.value);

    // Validation
    if (!principal || principal <= 0) {
        alert('Please enter a valid principal amount');
        return;
    }
    if (!annualRate || annualRate <= 0) {
        alert('Please enter a valid interest rate');
        return;
    }
    if (!tenure || tenure <= 0) {
        alert('Please enter a valid tenure');
        return;
    }

    // Convert tenure to months
    const tenureInMonths = tenureUnit === 'years' ? tenure * 12 : tenure;
    
    // Calculate monthly interest rate
    const monthlyRate = annualRate / 12 / 100;

    // EMI Formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureInMonths)) / 
                (Math.pow(1 + monthlyRate, tenureInMonths) - 1);

    const totalAmount = emi * tenureInMonths;
    const totalInterest = totalAmount - principal;

    // Display results without prepayment
    displayResults(emi, principal, totalInterest, totalAmount, tenureInMonths);

    // Calculate with prepayment if enabled
    if (enablePrepaymentCheckbox.checked) {
        calculateWithPrepayment(principal, monthlyRate, emi, tenureInMonths);
    } else {
        document.getElementById('prepaymentResults').style.display = 'none';
    }

    // Create chart
    createChart(principal, totalInterest);

    // Generate amortization schedule
    generateAmortizationSchedule(principal, monthlyRate, emi, tenureInMonths);

    // Show results section
    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Generate amortization schedule
function generateAmortizationSchedule(principal, monthlyRate, emi, totalMonths) {
    scheduleTableBody.innerHTML = '';
    
    let balance = principal;
    const prepaymentEnabled = enablePrepaymentCheckbox.checked;
    const prepaymentAmount = prepaymentEnabled ? parseFloat(prepaymentAmountInput.value) || 0 : 0;
    const prepaymentStartMonth = prepaymentEnabled ? parseInt(prepaymentMonthInput.value) || 0 : 0;
    const prepaymentType = prepaymentEnabled ? document.querySelector('input[name="prepaymentType"]:checked').value : 'onetime';
    const prepaymentFrequency = prepaymentType === 'recurring' ? parseInt(prepaymentFrequencySelect.value) : 0;
    
    let month = 0;
    
    while (balance > 0 && month < totalMonths * 2) {
        month++;
        
        const interest = balance * monthlyRate;
        let principalPayment = emi - interest;
        
        // Ensure we don't overpay
        if (principalPayment > balance) {
            principalPayment = balance;
        }
        
        let prepaymentThisMonth = 0;
        let isPrepaymentMonth = false;
        
        // Check for prepayment
        if (prepaymentEnabled && prepaymentAmount > 0) {
            if (prepaymentType === 'onetime') {
                if (month === prepaymentStartMonth) {
                    prepaymentThisMonth = Math.min(prepaymentAmount, balance - principalPayment);
                    isPrepaymentMonth = true;
                }
            } else {
                // Recurring prepayment
                if (month >= prepaymentStartMonth && (month - prepaymentStartMonth) % prepaymentFrequency === 0) {
                    prepaymentThisMonth = Math.min(prepaymentAmount, balance - principalPayment);
                    isPrepaymentMonth = true;
                }
            }
        }
        
        balance -= (principalPayment + prepaymentThisMonth);
        
        if (balance < 0.01) {
            balance = 0;
        }
        
        const row = document.createElement('tr');
        if (isPrepaymentMonth) {
            row.classList.add('prepayment-row');
        }
        
        const actualPayment = interest + principalPayment + prepaymentThisMonth;
        
        row.innerHTML = `
            <td>${month}</td>
            <td>₹${formatNumber(actualPayment.toFixed(2))}</td>
            <td>₹${formatNumber((principalPayment + prepaymentThisMonth).toFixed(2))}</td>
            <td>₹${formatNumber(interest.toFixed(2))}</td>
            <td>₹${formatNumber(balance.toFixed(2))}</td>
        `;
        
        scheduleTableBody.appendChild(row);
        
        if (balance === 0) {
            break;
        }
    }
}

// Display results
function displayResults(emi, principal, totalInterest, totalAmount, tenure) {
    document.getElementById('emiAmount').textContent = `₹${formatNumber(emi.toFixed(2))}`;
    document.getElementById('totalPrincipal').textContent = `₹${formatNumber(principal.toFixed(2))}`;
    document.getElementById('totalInterest').textContent = `₹${formatNumber(totalInterest.toFixed(2))}`;
    document.getElementById('totalAmount').textContent = `₹${formatNumber(totalAmount.toFixed(2))}`;
    document.getElementById('loanTenure').textContent = `${tenure} months (${(tenure / 12).toFixed(1)} years)`;
}

// Calculate with prepayment
function calculateWithPrepayment(principal, monthlyRate, originalEMI, originalTenure) {
    const prepaymentAmount = parseFloat(prepaymentAmountInput.value) || 0;
    const prepaymentStartMonth = parseInt(prepaymentMonthInput.value) || 12;
    const prepaymentType = document.querySelector('input[name="prepaymentType"]:checked').value;
    const prepaymentFrequency = prepaymentType === 'recurring' ? parseInt(prepaymentFrequencySelect.value) : 0;

    if (prepaymentAmount <= 0) {
        alert('Please enter a valid prepayment amount');
        return;
    }

    let balance = principal;
    let month = 0;
    let totalInterestWithPrepayment = 0;
    let totalPrepaymentMade = 0;
    let prepaymentCount = 0;

    // Simulate loan with prepayment
    while (balance > 0 && month < originalTenure * 2) { // Safety limit
        month++;

        // Calculate interest for this month
        const interest = balance * monthlyRate;
        totalInterestWithPrepayment += interest;

        // Calculate principal payment
        let principalPayment = originalEMI - interest;
        
        // Apply prepayment
        let prepaymentThisMonth = 0;
        if (prepaymentType === 'onetime') {
            // One-time prepayment
            if (month === prepaymentStartMonth) {
                prepaymentThisMonth = Math.min(prepaymentAmount, balance - principalPayment);
                totalPrepaymentMade += prepaymentThisMonth;
                prepaymentCount++;
            }
        } else {
            // Recurring prepayment
            if (month >= prepaymentStartMonth && (month - prepaymentStartMonth) % prepaymentFrequency === 0) {
                prepaymentThisMonth = Math.min(prepaymentAmount, balance - principalPayment);
                totalPrepaymentMade += prepaymentThisMonth;
                prepaymentCount++;
            }
        }

        // Update balance
        balance -= (principalPayment + prepaymentThisMonth);

        if (balance <= 0) {
            balance = 0;
            break;
        }
    }

    const newTenure = month;
    const newTotalAmount = principal + totalInterestWithPrepayment;
    const interestSaved = (originalEMI * originalTenure - principal) - totalInterestWithPrepayment;
    const timeSaved = originalTenure - newTenure;

    // Display prepayment results
    document.getElementById('newPrincipal').textContent = `₹${formatNumber(principal.toFixed(2))}`;
    document.getElementById('newInterest').textContent = `₹${formatNumber(totalInterestWithPrepayment.toFixed(2))}`;
    document.getElementById('interestSaved').textContent = `₹${formatNumber(interestSaved.toFixed(2))}`;
    document.getElementById('timeSaved').textContent = `${timeSaved} months (${(timeSaved / 12).toFixed(1)} years)`;
    
    const prepaymentLabel = prepaymentType === 'recurring' ? `Total Prepayments (${prepaymentCount}x)` : 'Total Prepayment';
    document.getElementById('totalPrepaymentLabel').textContent = prepaymentLabel;
    document.getElementById('totalPrepayment').textContent = `₹${formatNumber(totalPrepaymentMade.toFixed(2))}`;
    document.getElementById('newTotalAmount').textContent = `₹${formatNumber(newTotalAmount.toFixed(2))}`;
    document.getElementById('prepaymentResults').style.display = 'block';
}

// Create chart
function createChart(principal, totalInterest) {
    const ctx = document.getElementById('emiChart').getContext('2d');

    // Destroy existing chart if any
    if (chart) {
        chart.destroy();
    }

    chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Principal Amount', 'Total Interest'],
            datasets: [{
                data: [principal, totalInterest],
                backgroundColor: [
                    '#4f46e5',
                    '#ef4444'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                title: {
                    display: true,
                    text: 'Loan Breakdown',
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: 20
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '₹' + formatNumber(context.parsed.toFixed(2));
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            label += ` (${percentage}%)`;
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Format number with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Reset calculator
function resetCalculator() {
    principalInput.value = '7000000';
    interestRateInput.value = '7.1';
    tenureInput.value = '161';
    
    tenureUnit = 'months';
    yearsBtn.classList.remove('active');
    monthsBtn.classList.add('active');
    tenureLabel.textContent = 'Months';
    
    enablePrepaymentCheckbox.checked = false;
    prepaymentInputs.style.display = 'none';
    prepaymentAmountInput.value = '50000';
    prepaymentMonthInput.value = '12';
    
    resultsSection.style.display = 'none';
    scheduleTableContainer.style.display = 'none';
    showScheduleBtn.textContent = 'Show Payment Schedule';
    scheduleTableBody.innerHTML = '';
    
    if (chart) {
        chart.destroy();
        chart = null;
    }
}
