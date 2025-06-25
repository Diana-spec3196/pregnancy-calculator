/**
 * Калькулятор сроков беременности для ГКБ №15 им. О.М. Филатова
 * Версия 1.1
 */

// Конфигурация приложения
const config = {
    hospitalName: "ГКБ №15 им. О.М. Филатова",
    minCycleLength: 21,
    maxCycleLength: 45,
    minPregnancyWeek: 5,
    maxPregnancyWeek: 40
};

// Основные переменные
let currentTab = 'lastPeriodTab';
let lastCalculationDate = null;

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    initDates();
    setupEventListeners();
    updateHospitalHeader();
});

// Установка обработчиков событий
function setupEventListeners() {
    // Обработчики для вкладок
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });

    // Обработчик для кнопки расчета
    document.querySelector('button').addEventListener('click', calculatePregnancy);

    // Обработчики Enter в полях ввода
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') calculatePregnancy();
        });
    });
}

// Инициализация дат
function initDates() {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    
    document.getElementById('lastPeriod').value = formattedDate;
    document.getElementById('ultrasoundDate').value = formattedDate;
    document.getElementById('embryoTransferDate').value = formattedDate;
}

// Обновление шапки с названием больницы
function updateHospitalHeader() {
    const header = document.querySelector('.header-text h1');
    if (header) {
        header.textContent = config.hospitalName;
    }
}

// Переключение вкладок
function switchTab(tabId) {
    // Скрываем текущую активную вкладку
    document.getElementById(currentTab).classList.remove('active');
    document.querySelector(`.tab[data-tab="${currentTab}"]`).classList.remove('active');
    
    // Показываем новую вкладку
    currentTab = tabId;
    document.getElementById(currentTab).classList.add('active');
    document.querySelector(`.tab[data-tab="${currentTab}"]`).classList.add('active');
    
    // Сбрасываем результаты при переключении вкладок
    hideResults();
}

// Основная функция расчета
function calculatePregnancy() {
    try {
        const startTime = performance.now();
        let lastPeriodDate, conceptionDate, dueDate;
        
        // Выбор метода расчета
        switch(currentTab) {
            case 'lastPeriodTab':
                ({lastPeriodDate, conceptionDate, dueDate} = calculateByLastPeriod());
                break;
            case 'ultrasoundTab':
                ({lastPeriodDate, conceptionDate, dueDate} = calculateByUltrasound());
                break;
            case 'ecoTab':
                ({lastPeriodDate, conceptionDate, dueDate} = calculateByECO());
                break;
            default:
                throw new Error("Неизвестный метод расчета");
        }
        
        // Проверка дат
        if (!lastPeriodDate || !conceptionDate || !dueDate) {
            throw new Error("Ошибка при расчете дат");
        }
        
        // Расчет текущего срока
        const {currentWeek, currentDay} = calculateCurrentPregnancy(lastPeriodDate);
        
        // Определение триместра
        const trimester = determineTrimester(currentWeek);
        
        // Расчет важных дат
        const importantDates = calculateImportantDates(lastPeriodDate);
        
        // Отображение результатов
        displayResults({
            conceptionDate,
            currentWeek,
            currentDay,
            dueDate,
            trimester,
            importantDates
        });
        
        // Логирование времени выполнения
        const endTime = performance.now();
        console.log(`Расчет выполнен за ${(endTime - startTime).toFixed(2)} мс`);
        
        lastCalculationDate = new Date();
        
    } catch (error) {
        showError(error.message);
        console.error("Ошибка расчета:", error);
    }
}

// Расчет по последней менструации
function calculateByLastPeriod() {
    const lastPeriodDate = new Date(document.getElementById('lastPeriod').value);
    if (isNaN(lastPeriodDate.getTime())) {
        throw new Error("Пожалуйста, введите корректную дату последней менструации");
    }
    
    const cycleLength = parseInt(document.getElementById('cycleLength').value) || 28;
    if (cycleLength < config.minCycleLength || cycleLength > config.maxCycleLength) {
        throw new Error(`Длина цикла должна быть между ${config.minCycleLength} и ${config.maxCycleLength} днями`);
    }
    
    const ovulationDay = 14 - (28 - cycleLength)/2;
    const conceptionDate = new Date(lastPeriodDate);
    conceptionDate.setDate(conceptionDate.getDate() + ovulationDay);
    
    const dueDate = new Date(lastPeriodDate);
    dueDate.setDate(dueDate.getDate() + 280); // 40 недель
    
    return {lastPeriodDate, conceptionDate, dueDate};
}

// Расчет по УЗИ
function calculateByUltrasound() {
    const ultrasoundDate = new Date(document.getElementById('ultrasoundDate').value);
    if (isNaN(ultrasoundDate.getTime())) {
        throw new Error("Пожалуйста, введите корректную дату проведения УЗИ");
    }
    
    const ultrasoundWeek = parseInt(document.getElementById('ultrasoundWeek').value) || 0;
    const ultrasoundDay = parseInt(document.getElementById('ultrasoundDay').value) || 0;
    
    if (ultrasoundWeek < config.minPregnancyWeek || ultrasoundWeek > config.maxPregnancyWeek) {
        throw new Error(`Срок по УЗИ должен быть между ${config.minPregnancyWeek} и ${config.maxPregnancyWeek} неделями`);
    }
    
    if (ultrasoundDay < 0 || ultrasoundDay > 6) {
        throw new Error("Количество дней должно быть между 0 и 6");
    }
    
    const pregnancyDays = ultrasoundWeek * 7 + ultrasoundDay;
    const lastPeriodDate = new Date(ultrasoundDate);
    lastPeriodDate.setDate(lastPeriodDate.getDate() - pregnancyDays - 14);
    
    const conceptionDate = new Date(ultrasoundDate);
    conceptionDate.setDate(conceptionDate.getDate() - pregnancyDays);
    
    const dueDate = new Date(lastPeriodDate);
    dueDate.setDate(dueDate.getDate() + 280);
    
    return {lastPeriodDate, conceptionDate, dueDate};
}

// Расчет по ЭКО
function calculateByECO() {
    const embryoTransferDate = new Date(document.getElementById('embryoTransferDate').value);
    if (isNaN(embryoTransferDate.getTime())) {
        throw new Error("Пожалуйста, введите корректную дату переноса эмбриона");
    }
    
    const embryoAge = parseInt(document.getElementById('embryoAge').value) || 5;
    const daysToAdd = embryoAge === 3 ? 14 - 3 : embryoAge === 5 ? 14 - 5 : 14 - 6;
    
    const lastPeriodDate = new Date(embryoTransferDate);
    lastPeriodDate.setDate(lastPeriodDate.getDate() - daysToAdd);
    
    const conceptionDate = new Date(embryoTransferDate);
    conceptionDate.setDate(conceptionDate.getDate() - (embryoAge === 3 ? 3 : embryoAge === 5 ? 5 : 6));
    
    const dueDate = new Date(lastPeriodDate);
    dueDate.setDate(dueDate.getDate() + 280);
    
    return {lastPeriodDate, conceptionDate, dueDate};
}

// Расчет текущего срока беременности
function calculateCurrentPregnancy(lastPeriodDate) {
    const today = new Date();
    const diffTime = today - lastPeriodDate;
    
    if (diffTime < 0) {
        throw new Error("Выбранная дата находится в будущем!");
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const currentWeek = Math.floor(diffDays / 7);
    const currentDay = diffDays % 7;
    
    return {currentWeek, currentDay};
}

// Определение триместра
function determineTrimester(week) {
    if (week < 13) return "первый";
    if (week < 27) return "второй";
    return "третий";
}

// Расчет важных дат
function calculateImportantDates(lastPeriodDate) {
    const dates = {};
    const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
    
    dates.maternityLeave = addDays(lastPeriodDate, 210); // 30 недель
    dates.secondTrimester = addDays(lastPeriodDate, 98);  // 14 недель
    dates.thirdTrimester = addDays(lastPeriodDate, 196); // 28 недель
    
    return dates;
}

// Отображение результатов
function displayResults({conceptionDate, currentWeek, currentDay, dueDate, trimester, importantDates}) {
    const options = { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric', 
        weekday: 'long',
        timeZone: 'UTC'
    };
    
    document.getElementById('conceptionDate').textContent = conceptionDate.toLocaleDateString('ru-RU', options);
    document.getElementById('currentWeek').textContent = currentWeek;
    document.getElementById('currentDay').textContent = currentDay;
    document.getElementById('dueDate').textContent = dueDate.toLocaleDateString('ru-RU', options);
    document.getElementById('trimester').textContent = trimester;
    document.getElementById('maternityLeave').textContent = importantDates.maternityLeave.toLocaleDateString('ru-RU', options);
    document.getElementById('secondTrimester').textContent = importantDates.secondTrimester.toLocaleDateString('ru-RU', options);
    document.getElementById('thirdTrimester').textContent = importantDates.thirdTrimester.toLocaleDateString('ru-RU', options);
    
    showResults();
}

// Показать блок результатов
function showResults() {
    const resultElement = document.getElementById('result');
    resultElement.style.display = 'block';
    resultElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Скрыть блок результатов
function hideResults() {
    document.getElementById('result').style.display = 'none';
}

// Показать ошибку
function showError(message) {
    hideResults();
    alert(`Ошибка: ${message}`);
}

// Логирование (для отладки)
function logCalculation(method, data) {
    console.log(`Расчет методом ${method}:`, data);
}