
let values =[]; // 0+   1-   2x   3/  4t  5+-(min)  6+-(max)  7x/(min)  8x/(max) 
let examples =[];
let score = 1, mistake =0, totalMistake=0,examplesCount=10;
let block;
let numberOne,numberTwo,answer;


//для таймера вводные
var seconds = 0; 
var tens = 0; 
var appendTens = document.getElementById("tens")
var appendSeconds = document.getElementById("seconds")
var buttonStart = document.getElementById('button-start');
var buttonStop = document.getElementById('button-stop');
var buttonReset = document.getElementById('button-reset');
var Interval;

// Текущий день месяца
let currentDay = new Date().getDate();
// Количество дней в текущем месяце
let daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();   
// Количество дней в прошлом месяце
let daysInLastMonth = new Date(new Date().getFullYear(), (new Date().getMonth()-1) + 1, 0).getDate();   
// индекст текущего месяцы
let monthIndex = new Date().getMonth();
// массив для сохранения в облако
// let statsArray =[]; //0(время), 1(количество решенных примеров), 2(количество ошибок)
let TimeForSave,TimeForSaveOld=0; // запоминаю время перед его обнулением
let dayIndex = new Date().getDay();  // индекс дня недели
let oldstats=[];


// ловлю нажатие на иконку статистики
document.getElementById('statistic-icon').addEventListener('click', () => {statisticOpen();});


// открытие и закрытие блока с цветовыми темами, а так же ловню вбор пользователя насчет темы
document.getElementById('different-theme').addEventListener('click', () => { differentTheme('open');});
document.getElementById('different-theme-block').addEventListener('click', () => {differentTheme('close'); });
document.getElementById('standart').addEventListener('click', () => { themeChange('standart');});
document.getElementById('dark').addEventListener('click', () => { themeChange('dark');});
// document.getElementById('green').addEventListener('click', () => { themeChange('green');});
// document.getElementById('red').addEventListener('click', () => { themeChange('red');});

// при нажатии на чекбокс вызываю проверку есть ли хоть один закрытый чекбокс
document.getElementById('checkbox+').addEventListener('click', () => { checkChekBox(document.getElementById('checkbox+').value);});
document.getElementById('checkbox-').addEventListener('click', () => { checkChekBox(document.getElementById('checkbox-').value);});
document.getElementById('checkboxx').addEventListener('click', () => { checkChekBox(document.getElementById('checkboxx').value);});
document.getElementById('checkbox/').addEventListener('click', () => { checkChekBox(document.getElementById('checkbox/').value);});

// клик на кнопку для задавания маленького диапозона
document.getElementById('small-range').addEventListener('click', () => { smallRange();});

// клик на кнопку для задавания большого диапозона
document.getElementById('big-range').addEventListener('click', () => { bigRange();});

// клик на кнопку начать
document.getElementById('start-button').addEventListener('click', () => {fromHomeToExample();});

// клик на возврат на главную
document.getElementById('back-to-home-statistic').addEventListener('click', () => { statisticClose();});
document.getElementById('back-to-home').addEventListener('click', () => { let a=1;fromExampleToHome(a);});

// обработка кликов на клавиатуру, на каждую из клавиш
document.getElementById('number-1').addEventListener('click', () => { keyboardClick(document.getElementById('number-1').value);});
document.getElementById('number-2').addEventListener('click', () => { keyboardClick(document.getElementById('number-2').value);});
document.getElementById('number-3').addEventListener('click', () => { keyboardClick(document.getElementById('number-3').value);});
document.getElementById('number-4').addEventListener('click', () => { keyboardClick(document.getElementById('number-4').value);});
document.getElementById('number-5').addEventListener('click', () => { keyboardClick(document.getElementById('number-5').value);});
document.getElementById('number-6').addEventListener('click', () => { keyboardClick(document.getElementById('number-6').value);});
document.getElementById('number-7').addEventListener('click', () => { keyboardClick(document.getElementById('number-7').value);});
document.getElementById('number-8').addEventListener('click', () => { keyboardClick(document.getElementById('number-8').value);});
document.getElementById('number-9').addEventListener('click', () => { keyboardClick(document.getElementById('number-9').value);});
document.getElementById('number-0').addEventListener('click', () => { keyboardClick(document.getElementById('number-0').value);});
document.getElementById('number-enter').addEventListener('click', () => { keyboardClick(document.getElementById('number-enter').value);});
document.getElementById('number-delete').addEventListener('click', () => { keyboardClick(document.getElementById('number-delete').value);});



function statisticOpen(){
    block = document.getElementById('statistic');
    block.classList.remove('none');
    block = document.getElementById('main1');
    block.classList.add('none');


    window.Telegram.WebApp.CloudStorage.getItem("stats", (err, stats) => {

        if (stats === null || stats === undefined || stats === "") {
        }else{
            let arrayGraphExamples = [], arrayGraphTime = [], arrayGraphMistake = [];   
            stats = JSON.parse(stats);
            console.log('stats1',stats);
            // если пользователь зашел в новом месяце и сразу посмотрит статистику то она должна быть пустой а не прошлого месяца
            if(stats[0]!= monthIndex){
                window.Telegram.WebApp.CloudStorage.setItem("oldstats", JSON.stringify(stats));
                for(let i=1;i<=daysInMonth;i++){
                    stats[i]= [0,0,0];
                };    
            }
            // заполняю массив для рисования месячных графиков
            for (let i = 1; i <= daysInMonth; i++) {
                arrayGraphExamples.push({
                    day: String(i),
                    examples: stats[i][1],
                });
                arrayGraphTime.push({
                    day: String(i),
                    time: (stats[i][0]/60).toFixed(2),
                });

                let number=0;
                if(stats[i][2] != 0){
                    number = ((stats[i][1] - stats[i][2])/stats[i][1]).toFixed(2);
                }
                arrayGraphMistake.push({
                    day: String(i),
                    mistake: number,
                });
            }
            // рисую графики примеров
            new Morris.Line({
                element: 'graph-wrapper-examples',
                data: arrayGraphExamples,
                xkey: 'day',
                parseTime: false,
                ykeys: ['examples'],
                // hideHover: 'always',
                labels: ['examples'],
                lineColors: ['green']
            });
            // рисую графики времени
            new Morris.Line({
                element: 'graph-wrapper-time',
                data: arrayGraphTime,
                xkey: 'day',
                parseTime: false,
                ykeys: ['time'],
                // hideHover: 'always',
                labels: ['time'],
                lineColors: ['blue']
            });
            // рисую графики ошибок
            new Morris.Line({
                element: 'graph-wrapper-mistake',
                data: arrayGraphMistake,
                xkey: 'day',
                parseTime: false,
                ykeys: ['mistake'],
                // hideHover: 'always',
                labels: ['mistake'],
                lineColors: ['red']
            });
        }
        graphToToday('graph-conteiner-examples','graph-wrapper-examples'); // передвигаю на текущую дату
        graphToToday('graph-conteiner-time','graph-wrapper-time'); 
        graphToToday('graph-conteiner-mistake','graph-wrapper-mistake');
    });

}

function statisticClose(){
    block = document.getElementById('main1');
    block.classList.remove('none');
    block = document.getElementById('statistic');
    block.classList.add('none');
}


function graphToToday(one,two){
    let today = new Date().getDate(); // получаем текущий день месяца
    let container = document.getElementById(one);
    let chart = document.getElementById(two);

    // Ждем небольшой интервал, чтобы график точно успел отрисоваться
    setTimeout(() => {
        // Найти все подписи по оси X (Morris генерирует их с классом .x-axis-label или подобным)
        let labels = chart.querySelectorAll('text');

        let targetLabel = null;

        labels.forEach(label => {
            if (parseInt(label.textContent) === today) {
            targetLabel = label;
            }
        });

        if (targetLabel) {
            let labelRect = targetLabel.getBoundingClientRect();
            let containerRect = container.getBoundingClientRect();

            let offsetLeft = labelRect.left + container.scrollLeft - containerRect.left;
            let centerScroll = offsetLeft - container.clientWidth / 2 + labelRect.width / 2;

            container.scrollLeft = centerScroll;
        }
    }, 100);
}


function fromHomeToExample() { // переход с главного экрана на экран с пирмером

    // считываю все пораметры ползункув и чекбоксов
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for(let i =0;i<5;i++){    
        values[i] = checkboxes[i].checked;
    }
    var inputLower = document.querySelectorAll('input[type="text"]');
    values[5]= inputLower[0].value;
    values[6]= inputLower[1].value;
    values[7]= inputLower[2].value;
    values[8]= inputLower[3].value;
    values[9]= inputLower[4].value;
    examplesCount= values[9];
    // window.Telegram.WebApp.CloudStorage.setItem("values",values);
    localStorage.setItem('values',values);

    // меняю экраны между собой
    block = document.getElementById('main1');
    block.classList.add('none');
    block = document.getElementById('main2');
    block.classList.remove('none');
    dinamicRange();
    // закрываю сообщение о победе
    block = document.getElementById('win-message');
    block.classList.add('none');

    clearInterval(Interval);
    Interval = setInterval(startTimer, 10);

    // обнуляю масив примеров, ошибки и количество примеров перед новой итерацией
    examples =[]; 
    mistake=0;
    totalMistake=0;
    score=1;
    setExample();
}

function fromExampleToHome(back) {// переход с экранв с пирмером на главный экран


    if(back === 1){
        console.log('0totalMistake',totalMistake,'mistake',mistake);
        if(TimeForSaveOld == 0){
            TimeForSave = seconds+(tens*0.01);
        }else{
            TimeForSave = (seconds+(tens*0.01)) - TimeForSaveOld;
        }
        TimeForSaveOld = seconds+(tens*0.01);

        // сохраняю результаты в облако
        window.Telegram.WebApp.CloudStorage.getItem("stats", (err, stats) => {
            if (stats === null || stats === undefined || stats === "") {
                stats =[];
                for(let i=1;i<=daysInMonth;i++){
                    stats[i]= [0,0,0];
                };    
                stats[0] = monthIndex;
                stats[currentDay][0] = Number(TimeForSave);
                stats[currentDay][1] = 1;
                stats[currentDay][2] = Number(mistake);
            }else{
                stats = JSON.parse(stats);
                if(stats[0]!= monthIndex){
                    window.Telegram.WebApp.CloudStorage.setItem("oldstats", JSON.stringify(stats));
                    for(let i=1;i<=daysInMonth;i++){
                        stats[i]= [0,0,0];
                    };    
                    stats[0] = monthIndex;
                    stats[currentDay][0] = Number(stats[currentDay][0]) + Number(TimeForSave);
                    stats[currentDay][1] = Number(stats[currentDay][1]) + 1;
                    stats[currentDay][2] = Number(stats[currentDay][2]) + Number(mistake);
                }else{
                    stats[currentDay][0] = Number(stats[currentDay][0]) + Number(TimeForSave);
                    stats[currentDay][1] = Number(stats[currentDay][1]) + 1;
                    stats[currentDay][2] = Number(stats[currentDay][2]) + Number(mistake);
                }   
            }
            window.Telegram.WebApp.CloudStorage.setItem("stats", JSON.stringify(stats));
            console.log('2', stats);
        });

        totalMistake += mistake;

        let a;
        if(tens <= 9){
            a = "0" + tens;
        }else{
            a=tens;
        }
        let b;
        if (seconds <= 9){
            b = "0" + seconds;
        }else{
            b = seconds;
        }
        document.getElementById('win-message').outerHTML = `<p id="win-message" class="win-message ">Ошибки: ${totalMistake} <br> Время: ${b}:${a}</p>`;
    }
    //меняю ползунки и чекбоксы на сохраненные значения
    let test = localStorage.getItem('values');

    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (test === null || test === undefined || test === "") {
        for(let i =0;i<5;i++){    
            checkboxes[i].checked = true;
        }
    }else{
        let forMemery = test.split(',');
        for(let i =0;i<5;i++){  
            if(forMemery[i] == "true"){
                checkboxes[i].checked = true;
            }
        }
        dinamicRange();
    }

    // меняю страницы местами
    block = document.getElementById('main1');
    block.classList.remove('none');
    block = document.getElementById('main2');
    block.classList.add('none');

    // обнуляю таймер
    clearInterval(Interval);
    tens = "";
    seconds = "";
    appendTens.innerHTML = tens;
    appendSeconds.innerHTML = seconds;

    let input = document.getElementById('example-answer');
    input.outerHTML = `<p id="example-answer"></p>`;
}

function dinamicRange(){ // изменяет ползунки на сохранненые значения, ничего не менял взял с старого кода
    // console.log('7');
    // window.Telegram.WebApp.CloudStorage.getItem("values", (err,test) => {
        let test = localStorage.getItem('values');

        let adapter = test.split(',');
        let forMemery = [adapter[5],adapter[6],adapter[7],adapter[8],adapter[9]] 
        // 1valLower  2valUpper  3lower-double  4upper-double 
        // console.log('8');
        var max = $('.upper').attr('max');
        var min = $('.lower').attr('min');
        var valLower = forMemery[0];
        var valUpper = forMemery[1];

        if (parseFloat(valLower) > parseFloat(valUpper)) {
            var trade = valLower;
            valLower = valUpper;
            valUpper = trade;
        }
        var width = valUpper * 100 / max;
        var left = valLower * 100 / max;
        $('.fill').css('left', 'calc(' + left + '%)');
        $('.fill').css('width', width - left + '%');

        // Update info
        if (parseInt(valLower) == min) {
            $('.easy-basket-lower').val('0');
        } else {
            $('.easy-basket-lower').val(parseInt(valLower));
        }
        if (parseInt(valUpper) == max) {
            $('.easy-basket-upper').val('300');
        } else {
            $('.easy-basket-upper').val(parseInt(valUpper));
        }

        // изменяем диапазон цен вручную
        if ( valUpper > 300 ) {
            var left = max;
        }
        if ( valLower < 0 ) {
            var left = min;
        } else if ( valLower > max ) {
            var left = min;
        }
        // меняем положение ползунков
        $('.lower').val(valLower);
        $('.upper').val(valUpper);  
        $('.easy-basket-filter-info p input').focus(function() {
            $(this).val('');
        });
        $('.easy-basket-filter-info .iLower input').blur(function() {
            var valLower = $('.lower').val();
            $(this).val(Math.floor(valLower));
        });
        $('.easy-basket-filter-info .iUpper input').blur(function() {
            var valUpper = $('.upper').val();
            $(this).val(Math.floor(valUpper));
        });




        max = $('.upper-double').attr('max');
        min = $('.lower-double').attr('min');
        valLower = forMemery[2];
        valUpper = forMemery[3];
        if (parseFloat(valLower) > parseFloat(valUpper)) {
            var trade = valLower;
            valLower = valUpper;
            valUpper = trade;
        }
        width = valUpper * 100 / max;
        left = valLower * 100 / max;
        $('.fill-double').css('left', 'calc(' + left + '%)');
        $('.fill-double').css('width', width - left + '%');

        // Update info
        if (parseInt(valLower) == min) {
            $('.easy-basket-lower-double').val('0');
        } else {
            $('.easy-basket-lower-double').val(parseInt(valLower));
        }
        if (parseInt(valUpper) == max) {
            $('.easy-basket-upper-double').val('50');
        } else {
            $('.easy-basket-upper-double').val(parseInt(valUpper));
        }


        if ( valUpper > 50 ) {
            var left = max;
        }
        if ( valLower < 0 ) {
            var left = min;
        } else if ( valLower > max ) {
            var left = min;
        }
        $('.fill-double').css('left', 'calc(' + left + '%)');
        $('.fill-double').css('width', width - left + '%');
        // меняем положение ползунков
        $('.lower-double').val(valLower);
        $('.upper-double').val(valUpper);
        $('.easy-basket-filter-info-double p input').focus(function() {
            $(this).val('');
        });
        $('.easy-basket-filter-info-double .iLower-double input').blur(function() {
            var valLower = $('.lower-double').val();
            $(this).val(Math.floor(valLower));
        });
        $('.easy-basket-filter-info-double .iUpper-double input').blur(function() {
            var valUpper = $('.upper-double').val();
            $(this).val(Math.floor(valUpper));
        });





        max = $('.upper-three').attr('max');
        min = $('.lower-three').attr('min');
        valLower = forMemery[4];
        valUpper = forMemery[4];
        if (parseFloat(valLower) > parseFloat(valUpper)) {
            var trade = valLower;
            valLower = valUpper;
            valUpper = trade;
        }
        width = valUpper * 100 / max;
        left = valLower * 100 / max;
        $('.fill-three').css('left', 'calc(' + left + '%)');
        $('.fill-three').css('width', width - left + '%');

        // Update info
        if (parseInt(valLower) == min) {
            $('.easy-basket-lower-three').val('5');
        } else {
            $('.easy-basket-lower-three').val(parseInt(valLower));
        }
        if (parseInt(valUpper) == max) {
            $('.easy-basket-upper-three').val('25');
        } else {
            $('.easy-basket-upper-three').val(parseInt(valUpper));
        }


        if ( valUpper > 25 ) {
            var left = max;
        }
        if ( valLower < 5 ) {
            var left = min;
        } else if ( valLower > max ) {
            var left = min;
        }
        $('.fill-three').css('left', 'calc(' + left + '%)');
        $('.fill-three').css('width', width - left + '%');
        // меняем положение ползунков
        $('.lower-three').val(valLower);
        $('.upper-three').val(valUpper);
        $('.easy-basket-filter-info-three p input').focus(function() {
            $(this).val('');
        });
        $('.easy-basket-filter-info-three .iLower-three input').blur(function() {
            var valLower = $('.lower-three').val();
            $(this).val(Math.floor(valLower));
        });
        $('.easy-basket-filter-info-three .iUpper-three input').blur(function() {
            var valUpper = $('.upper-three').val();
            $(this).val(Math.floor(valUpper));
        });
    // });
}

function smallRange(){  // изменяет ползунки и чек боксы на заданное значения, ничего не менял взял с старого кода

    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes[0].checked = true;
    checkboxes[1].checked = true;
    checkboxes[2].checked = true;
    checkboxes[3].checked = true;
    checkboxes[4].checked = true;

    var max = $('.upper').attr('max');
    var min = $('.lower').attr('min');
    var valLower = 2;
    var valUpper = 20;

    if (parseFloat(valLower) > parseFloat(valUpper)) {
        var trade = valLower;
        valLower = valUpper;
        valUpper = trade;
    }
    var width = valUpper * 100 / max;
    var left = valLower * 100 / max;
    $('.fill').css('left', 'calc(' + left + '%)');
    $('.fill').css('width', width - left + '%');

    // Update info
    if (parseInt(valLower) == min) {
        $('.easy-basket-lower').val('0');
    } else {
        $('.easy-basket-lower').val(parseInt(valLower));
    }
    if (parseInt(valUpper) == max) {
        $('.easy-basket-upper').val('300');
    } else {
        $('.easy-basket-upper').val(parseInt(valUpper));
    }

    // изменяем диапазон цен вручную
    if ( valUpper > 300 ) {
        var left = max;
    }
    if ( valLower < 0 ) {
        var left = min;
    } else if ( valLower > max ) {
        var left = min;
    }
    // меняем положение ползунков
    $('.lower').val(valLower);
    $('.upper').val(valUpper);  
    $('.easy-basket-filter-info p input').focus(function() {
        $(this).val('');
    });
    $('.easy-basket-filter-info .iLower input').blur(function() {
        var valLower = $('.lower').val();
        $(this).val(Math.floor(valLower));
    });
    $('.easy-basket-filter-info .iUpper input').blur(function() {
        var valUpper = $('.upper').val();
        $(this).val(Math.floor(valUpper));
    });



    max = $('.upper-double').attr('max');
        min = $('.lower-double').attr('min');
        valLower = 2;
        valUpper = 10;
        if (parseFloat(valLower) > parseFloat(valUpper)) {
            var trade = valLower;
            valLower = valUpper;
            valUpper = trade;
        }
        width = valUpper * 100 / max;
        left = valLower * 100 / max;
        $('.fill-double').css('left', 'calc(' + left + '%)');
        $('.fill-double').css('width', width - left + '%');

        // Update info
        if (parseInt(valLower) == min) {
            $('.easy-basket-lower-double').val('0');
        } else {
            $('.easy-basket-lower-double').val(parseInt(valLower));
        }
        if (parseInt(valUpper) == max) {
            $('.easy-basket-upper-double').val('50');
        } else {
            $('.easy-basket-upper-double').val(parseInt(valUpper));
        }


        if ( valUpper > 50 ) {
            var left = max;
        }
        if ( valLower < 0 ) {
            var left = min;
        } else if ( valLower > max ) {
            var left = min;
        }
        $('.fill-double').css('left', 'calc(' + left + '%)');
        $('.fill-double').css('width', width - left + '%');
        // меняем положение ползунков
        $('.lower-double').val(valLower);
        $('.upper-double').val(valUpper);
        $('.easy-basket-filter-info-double p input').focus(function() {
            $(this).val('');
        });
        $('.easy-basket-filter-info-double .iLower-double input').blur(function() {
            var valLower = $('.lower-double').val();
            $(this).val(Math.floor(valLower));
        });
        $('.easy-basket-filter-info-double .iUpper-double input').blur(function() {
            var valUpper = $('.upper-double').val();
            $(this).val(Math.floor(valUpper));
        });
}

function bigRange(){// изменяет ползунки и чек боксы на заданное значения, ничего не менял взял с старого кода

    var checkboxes = document.querySelectorAll('input[type="checkbox"]');

    checkboxes[0].checked = true;
    checkboxes[1].checked = true;
    checkboxes[2].checked = true;
    checkboxes[3].checked = true;
    checkboxes[4].checked = false;

var max = $('.upper').attr('max');
var min = $('.lower').attr('min');
var valLower = 150;
var valUpper = 300;

if (parseFloat(valLower) > parseFloat(valUpper)) {
    var trade = valLower;
    valLower = valUpper;
    valUpper = trade;
}
var width = valUpper * 100 / max;
var left = valLower * 100 / max;
$('.fill').css('left', 'calc(' + left + '%)');
$('.fill').css('width', width - left + '%');

// Update info
if (parseInt(valLower) == min) {
    $('.easy-basket-lower').val('0');
} else {
    $('.easy-basket-lower').val(parseInt(valLower));
}
if (parseInt(valUpper) == max) {
    $('.easy-basket-upper').val('300');
} else {
    $('.easy-basket-upper').val(parseInt(valUpper));
}

// изменяем диапазон цен вручную
if ( valUpper > 300 ) {
    var left = max;
}
if ( valLower < 0 ) {
    var left = min;
} else if ( valLower > max ) {
    var left = min;
}
// меняем положение ползунков
$('.lower').val(valLower);
$('.upper').val(valUpper);  
$('.easy-basket-filter-info p input').focus(function() {
    $(this).val('');
});
$('.easy-basket-filter-info .iLower input').blur(function() {
    var valLower = $('.lower').val();
    $(this).val(Math.floor(valLower));
});
$('.easy-basket-filter-info .iUpper input').blur(function() {
    var valUpper = $('.upper').val();
    $(this).val(Math.floor(valUpper));
});



max = $('.upper-double').attr('max');
    min = $('.lower-double').attr('min');
    valLower = 25;
    valUpper = 50;
    if (parseFloat(valLower) > parseFloat(valUpper)) {
        var trade = valLower;
        valLower = valUpper;
        valUpper = trade;
    }
    width = valUpper * 100 / max;
    left = valLower * 100 / max;
    $('.fill-double').css('left', 'calc(' + left + '%)');
    $('.fill-double').css('width', width - left + '%');

    // Update info
    if (parseInt(valLower) == min) {
        $('.easy-basket-lower-double').val('0');
    } else {
        $('.easy-basket-lower-double').val(parseInt(valLower));
    }
    if (parseInt(valUpper) == max) {
        $('.easy-basket-upper-double').val('50');
    } else {
        $('.easy-basket-upper-double').val(parseInt(valUpper));
    }


    if ( valUpper > 50 ) {
        var left = max;
    }
    if ( valLower < 0 ) {
        var left = min;
    } else if ( valLower > max ) {
        var left = min;
    }
    $('.fill-double').css('left', 'calc(' + left + '%)');
    $('.fill-double').css('width', width - left + '%');
    // меняем положение ползунков
    $('.lower-double').val(valLower);
    $('.upper-double').val(valUpper);
    $('.easy-basket-filter-info-double p input').focus(function() {
        $(this).val('');
    });
    $('.easy-basket-filter-info-double .iLower-double input').blur(function() {
        var valLower = $('.lower-double').val();
        $(this).val(Math.floor(valLower));
    });
    $('.easy-basket-filter-info-double .iUpper-double input').blur(function() {
        var valUpper = $('.upper-double').val();
        $(this).val(Math.floor(valUpper));
    });
}

function startTimer () { // реализация таймера
    tens++; 
    if(values[4] == "true" || values[4] == true){
        if(seconds == 0|| seconds == 'none'){
            appendSeconds.innerHTML = "00";
        }
    }
    if (tens > 99) {
        seconds++;
        if(values[4] == "true" || values[4] == true){
            appendSeconds.innerHTML = "0" + seconds;
        }
        tens = 0;
    }

    if (seconds > 9){
        if(values[4] == "true" || values[4] == true){
            appendSeconds.innerHTML = seconds;
        }
    }
}

function keyboardClick(value){
    let input = document.getElementById('example-answer');
    let answerUser = input.textContent ;
    if(value == "delete"){
        answerUser = answerUser.slice(0,answerUser.length-1);
        input.outerHTML = `<p id="example-answer">${ answerUser }</p>`;
    } else if(value == "enter"){
        if(answerUser == answer){
            score++;
            input.outerHTML = `<p id="example-answer"></p>`;
            blink('example-answer-block','good');

            if(TimeForSaveOld == 0){
                TimeForSave = seconds+(tens*0.01);
            }else{
                TimeForSave = (seconds+(tens*0.01)) - TimeForSaveOld;
            }
            TimeForSaveOld = seconds+(tens*0.01);


            // сохраняю результаты в облако
            window.Telegram.WebApp.CloudStorage.getItem("stats", (err, stats) => {
                if (stats === null || stats === undefined || stats === "") {
                    stats =[];
                    for(let i=1;i<=daysInMonth;i++){
                        stats[i]= [0,0,0];
                    };    
                    stats[0] = monthIndex;
                    stats[currentDay][0] = Number(TimeForSave);
                    stats[currentDay][1] = 1;
                    stats[currentDay][2] = Number(mistake);
                }else{
                    stats = JSON.parse(stats);
                    if(stats[0]!= monthIndex){
                        window.Telegram.WebApp.CloudStorage.setItem("oldstats", JSON.stringify(stats));
                        for(let i=1;i<=daysInMonth;i++){
                            stats[i]= [0,0,0];
                        };    
                        stats[0] = monthIndex;
                        stats[currentDay][0] = Number(stats[currentDay][0]) + Number(TimeForSave);
                        stats[currentDay][1] = Number(stats[currentDay][1]) + 1;
                        stats[currentDay][2] = Number(stats[currentDay][2]) + Number(mistake);
                    }else{
                        stats[currentDay][0] = Number(stats[currentDay][0]) + Number(TimeForSave);
                        stats[currentDay][1] = Number(stats[currentDay][1]) + 1;
                        stats[currentDay][2] = Number(stats[currentDay][2]) + Number(mistake);
                    }   
                }
                window.Telegram.WebApp.CloudStorage.setItem("stats", JSON.stringify(stats));
                console.log('2', stats);
                mistake=0;
            });
            totalMistake += mistake;

            if(score>=(+examplesCount+1)){
                let a;
                if(tens <= 9){
                    a = "0" + tens;
                }else{
                    a=tens;
                }
                let b;
                if (seconds <= 9){
                    b = "0" + seconds;
                }else{
                    b = seconds;
                }
                document.getElementById('win-message').outerHTML = `<p id="win-message" class="win-message ">Ошибки: ${totalMistake} <br> Время: ${b}:${a}</p>`;
                fromExampleToHome();
            }else{
                setExample();
            }
        }else{
            mistake=1;
            blink('example-answer-block','bad')
        }
    } else if(answerUser.length < 6){
        answerUser += value ;
        input.outerHTML = `<p id="example-answer">${ answerUser }</p>`;
    } else{
        blink('example-answer-block','bad')
    }
}

function setExample(){ // создаю пример и вывожу на экран
    // 0+   1-   2x   3/  4t  5+-(min)  6+-(max)  7x/(min)  8x/(max) 

    numberOne = 0;
    numberTwo = 0;
    let symbol;
    let symbolArray = ['+', '−', '⋅', '∶',];
    // window.Telegram.WebApp.CloudStorage.getItem("values", (err,test) => {
        // values = test.split(',');
        values = localStorage.getItem('values').split(',');

        for(let exit=0;exit<10;exit++){ // проверка на то были ли уже в предыдущих примерах подобные ответы или операнды
            let a =0;
            for(let i=0;i<5;){ // рандомлю знак из тех что доступны
                symbol = randomNumber(0, 3);
                if(values[symbol] == "true"){
                    i=10;
                }
            }

            switch(symbol){ // создаю числа для примера
                case 0: // '+'
                    numberOne = randomNumber(+values[5],+values[6]);
                    numberTwo = randomNumber(+values[5],+values[6]);
                    answer = numberOne + numberTwo;
                break;
                case 1:// '-'
                    for(let exit=0;exit<10;){
                        numberOne = randomNumber(+values[5],+values[6]);
                        numberTwo = randomNumber(+values[5],+values[6]);
                        let a;
                        if(numberOne < numberTwo){
                            answer = numberTwo - numberOne;
                            a=numberTwo;
                            numberTwo = numberOne;
                            numberOne = a;
                            exit= 100;
                        } else if(numberOne = numberTwo){
                        } else {
                            answer = numberOne - numberTwo;
                            exit= 100;
                        }
                    }
                break;
                case 2:// '*'
                    numberOne = randomNumber(+values[7],+values[8]);
                    numberTwo = randomNumber(+values[7],+values[8]);
                    answer = numberOne * numberTwo;
                break;
                case 3:// '/'
                    let forSort;
                    for(let i =0;i < 1;){
                        numberOne = randomNumber(+values[7],+values[8]);
                        numberTwo = randomNumber(+values[7],+values[8]);
                        if(numberOne == numberTwo || numberOne == 0 ||numberTwo == 0 || numberOne == 1 ||numberTwo == 1){
                        } else{
                            forSort = numberOne * numberTwo;
                            numberOne =forSort;
                            answer = forSort / numberTwo;
                            i++;
                        }
                    }
                break;
            }
            for(let i=1;i<=examplesCount;i++){
                if(symbol == examples[(i-1)*4]){
                    if(examples[(i-1)*4+3] == answer  || examples[(i-1)*4+1] == numberOne || examples[(i-1)*4+1] == numberTwo || examples[(i-1)*4+2] == numberOne || examples[(i-1)*4+2] == numberTwo){
                        i=100;
                    }else{
                        a++;
                    }
                }else{
                    a++;
                }
            }
            if(a ==examplesCount ){exit=100;} // если прошло сверку со всеми 10 примерами то 
            examples[(score-1)*4]=symbol;
            examples[(score-1)*4+1]=numberOne;
            examples[(score-1)*4+2]=numberTwo;
            examples[(score-1)*4+3]=answer;
            // console.log(examples);
            // console.log(a,'a', exit, 'exit');
            // exit=0;
        }
    // });

    let inputExample = document.getElementById('example');
    inputExample.outerHTML = `<p id="example">${ numberOne } ${ symbolArray[symbol] } ${ numberTwo } = </p>`;
    console.log("Answer - ",answer);

    let inputScore = document.getElementById('score');
    inputScore.outerHTML = `<p id="score">${score}/${examplesCount}</p>`;
}

function randomNumber(min, max){ // генерациия рандомных чисел
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function blink(input, value){ // при проверках подсвечивать правильные или неправильные действия
    let inputt = document.getElementById(input) ;
    inputt.style.transition = "0.4s";
    if(value == 'bad'){
        inputt.classList.add('blink-bad');
        setTimeout(function() {
            inputt.classList.remove('blink-bad');
        }, 400);
    }else{
        inputt.classList.add('blink-good');
        setTimeout(function() {
            inputt.classList.remove('blink-good');
        }, 400);
    }
}

function checkChekBox(value){ // проверка есть ли хоть один закрытый чекбокс
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let a=0;
    for(let i =0;i<4;i++){    
        values[i] = checkboxes[i].checked;
        if(checkboxes[i].checked == true){
            a++;
        }
    }
    if(a == 0){
        checkboxes[value].checked = true;
    }
}

function differentTheme(value){ // выдвижение блока с цветавыми темами
    if(value =='close'){
        document.getElementById('conteiner').style.width = '0';
        document.getElementById('different-theme-block').style.width = '0';
    }else if(value =='open'){
        document.getElementById('conteiner').style.width = '28vh';
        document.getElementById('different-theme-block').style.width = '100vw';
    }
}

function themeChange(color){
    event.stopPropagation(); // Останавливаем обработку для родительского блока при клике на обьект
    localStorage.setItem('userTheme', color);
    document.getElementById('theme').href = `./thems/${color}.css`;
}





document.addEventListener('DOMContentLoaded', () => { // первый заход и разложение сохраненных значений
    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.disableVerticalSwipes();
    if(localStorage.getItem('userTheme') == null || localStorage.getItem('userTheme') === undefined || localStorage.getItem('userTheme') === "" ){
        localStorage.setItem('userTheme', 'standart');
        document.getElementById('theme').href = `./thems/standart.css`;
    }else{
        document.getElementById('theme').href = `./thems/${localStorage.getItem('userTheme')}.css`;
    }
    // window.Telegram.WebApp.CloudStorage.getItem("values", (err,test) => {
        let test = localStorage.getItem('values');
        let checkboxes = document.querySelectorAll('input[type="checkbox"]');
        // console.log(test);
        if (test === null || test === undefined || test === "") {
            for(let i =0;i<5;i++){    
                checkboxes[i].checked = true;
            }
        }else{
            let forMemery = test.split(',');
            for(let i =0;i<5;i++){  
                if(forMemery[i] == "true"){
                    checkboxes[i].checked = true;
                }
            }
            dinamicRange();
        }
    // });
})





jQuery(document).ready(function() { // код первого ползунка диапозона на старте
	$('.upper').on('input', setFill);
	$('.lower').on('input', setFill);

	var max = $('.upper').attr('max');
	var min = $('.lower').attr('min');

	function setFill(evt) {
		var valUpper = $('.upper').val();
		var valLower = $('.lower').val();

		if (parseFloat(valLower) > parseFloat(valUpper)) {
			var trade = valLower;
			valLower = valUpper;
			valUpper = trade;
		}
		
		var width = valUpper * 100 / max;
		var left = valLower * 100 / max;
		$('.fill').css('left', 'calc(' + left + '%)');
		$('.fill').css('width', width - left + '%');
		
		// Update info
		if (parseInt(valLower) == min) {
			$('.easy-basket-lower').val('0');
		} else {
			$('.easy-basket-lower').val(parseInt(valLower));
		}
		if (parseInt(valUpper) == max) {
			$('.easy-basket-upper').val('300');
		} else {
			$('.easy-basket-upper').val(parseInt(valUpper));
		}
		$('.histogram-list li').removeClass('ui-histogram-active');
	}
	
	// изменяем диапазон цен вручную
	$('.easy-basket-filter-info p input').keyup(function() {
		var valUpper = $('.easy-basket-upper').val();
		var valLower = $('.easy-basket-lower').val();
		var width = valUpper * 100 / max;
		var left = valLower * 100 / max;
		if ( valUpper > 300 ) {
			var left = max;
		}
		if ( valLower < 0 ) {
			var left = min;
		} else if ( valLower > max ) {
			var left = min;
		}
		$('.fill').css('left', 'calc(' + left + '%)');
		$('.fill').css('width', width - left + '%');
		// меняем положение ползунков
		$('.lower').val(valLower);
		$('.upper').val(valUpper);  
	});
	$('.easy-basket-filter-info p input').focus(function() {
		$(this).val('');
	});
	$('.easy-basket-filter-info .iLower input').blur(function() {
		var valLower = $('.lower').val();
		$(this).val(Math.floor(valLower));
	});
	$('.easy-basket-filter-info .iUpper input').blur(function() {
		var valUpper = $('.upper').val();
		$(this).val(Math.floor(valUpper));
	});
});

jQuery(document).ready(function() {  // код второго ползунка диапозона на старте
	$('.upper-double').on('input', setFill);
	$('.lower-double').on('input', setFill);

	var max = $('.upper-double').attr('max');
	var min = $('.lower-double').attr('min');

	function setFill(evt) {
		var valUpper = $('.upper-double').val();
		var valLower = $('.lower-double').val();
		if (parseFloat(valLower) > parseFloat(valUpper)) {
			var trade = valLower;
			valLower = valUpper;
			valUpper = trade;
		}
		
		var width = valUpper * 100 / max;
		var left = valLower * 100 / max;
		$('.fill-double').css('left', 'calc(' + left + '%)');
		$('.fill-double').css('width', width - left + '%');
		
		// Update info
		if (parseInt(valLower) == min) {
			$('.easy-basket-lower-double').val('0');
		} else {
			$('.easy-basket-lower-double').val(parseInt(valLower));
		}
		if (parseInt(valUpper) == max) {
			$('.easy-basket-upper-double').val('50');
		} else {
			$('.easy-basket-upper-double').val(parseInt(valUpper));
		}
		$('.histogram-list li').removeClass('ui-histogram-active');
	}
	
	// изменяем диапазон цен вручную
	$('.easy-basket-filter-info-double p input').keyup(function() {
		var valUpper = $('.easy-basket-upper-double').val();
		var valLower = $('.easy-basket-lower-double').val();
		var width = valUpper * 100 / max;
		var left = valLower * 100 / max;
		if ( valUpper > 50 ) {
			var left = max;
		}
		if ( valLower < 0 ) {
			var left = min;
		} else if ( valLower > max ) {
			var left = min;
		}
		$('.fill-double').css('left', 'calc(' + left + '%)');
		$('.fill-double').css('width', width - left + '%');
		// меняем положение ползунков
		$('.lower-double').val(valLower);
		$('.upper-double').val(valUpper);
	});
	$('.easy-basket-filter-info-double p input').focus(function() {
		$(this).val('');
	});
	$('.easy-basket-filter-info-double .iLower-double input').blur(function() {
		var valLower = $('.lower-double').val();
		$(this).val(Math.floor(valLower));
	});
	$('.easy-basket-filter-info-double .iUpper-double input').blur(function() {
		var valUpper = $('.upper-double').val();
		$(this).val(Math.floor(valUpper));
	});
});

jQuery(document).ready(function() {  // код ползунка количества уровней
	$('.upper-three').on('input', setFill);
	$('.lower-three').on('input', setFill);

	var max = $('.upper-three').attr('max');
	var min = $('.lower-three').attr('min');

	function setFill(evt) {
		var valUpper = $('.upper-three').val();
		var valLower = $('.lower-three').val();
		if (parseFloat(valLower) > parseFloat(valUpper)) {
			var trade = valLower;
			valLower = valUpper;
			valUpper = trade;
		}
		
		var width = valUpper * 100 / max;
		var left = valLower * 100 / max;
		$('.fill-three').css('left', 'calc(' + left + '%)');
		$('.fill-three').css('width', width - left + '%');
		
		// Update info
		if (parseInt(valLower) == min) {
			$('.easy-basket-lower-three').val('5');
		} else {
			$('.easy-basket-lower-three').val(parseInt(valLower));
		}
		// if (parseInt(valUpper) == max) {
		// 	$('.easy-basket-upper-three').val('25');
		// } else {
		// 	$('.easy-basket-upper-three').val(parseInt(valUpper));
		// }
		$('.histogram-list li').removeClass('ui-histogram-active');
	}
	
	// изменяем диапазон цен вручную
	$('.easy-basket-filter-info-three p input').keyup(function() {
		var valUpper = $('.easy-basket-upper-three').val();
		var valLower = $('.easy-basket-lower-three').val();
		var width = valUpper * 100 / max;
		var left = valLower * 100 / max;
		if ( valUpper > 25 ) {
			var left = max;
		}
		if ( valLower < 5 ) {
			var left = min;
		} else if ( valLower > max ) {
			var left = min;
		}
		$('.fill-three').css('left', 'calc(' + left + '%)');
		$('.fill-three').css('width', width - left + '%');
		// меняем положение ползунков
		$('.lower-three').val(valLower);
		$('.upper-three').val(valUpper);
	});
	$('.easy-basket-filter-info-three p input').focus(function() {
		$(this).val('');
	});
	$('.easy-basket-filter-info-three .iLower-three input').blur(function() {
		var valLower = $('.lower-three').val();
		$(this).val(Math.floor(valLower));
	});
	$('.easy-basket-filter-info-three .iUpper-three input').blur(function() {
		var valUpper = $('.upper-three').val();
		$(this).val(Math.floor(valUpper));
	});
});