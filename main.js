
let forScore =[]; // 0+   1-   2x   3/  4t  5+-(min)  6+-(max)  7x/(min)  8x/(max) 
// let examples =[[],[],[],[],[],[],[],[],[],[]];
let score = 1, mistake =0,examplesCount=2;
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
var Interval ;

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
document.getElementById('back-to-home').addEventListener('click', () => { fromExampleToHome();});

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


function fromHomeToExample() { // переход с главного экрана на экран с пирмером
    
    // считываю все пораметры ползункув и чекбоксов
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for(let i =0;i<5;i++){    
        forScore[i] = checkboxes[i].checked;
    }
    var inputLower = document.querySelectorAll('input[type="text"]');
    forScore[5]= inputLower[0].value;
    forScore[6]= inputLower[1].value;
    forScore[7]= inputLower[2].value;
    forScore[8]= inputLower[3].value;
    localStorage.setItem('forScore',forScore);

    // меняю экраны между собой
    block = document.getElementById('main1');
    block.classList.add('none');
    block = document.getElementById('main2');
    block.classList.remove('none');

    // закрываю сообщение о победе
    block = document.getElementById('win-message');
    block.classList.add('none');

    // запускаю время если пользователь это отметил
    if(forScore[4] == "true" || forScore[4] == true){
        clearInterval(Interval);
        Interval = setInterval(startTimer, 10);
    }

    mistake=0;
    score=1;
    setExample();
}

function fromExampleToHome() {// переход с экранв с пирмером на главный экран

    //меняю ползунки и чекбоксы на сохраненные значения
    let test = localStorage.getItem('forScore');
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
    tens = "00";
    seconds = "00";
    appendTens.innerHTML = tens;
    appendSeconds.innerHTML = seconds;

    let input = document.getElementById('example-answer');
    input.outerHTML = `<p id="example-answer"></p>`;
}

function dinamicRange(){ // изменяет ползунки на сохранненые значения, ничего не менял взял с старого кода
    // console.log('7');
    let test = localStorage.getItem('forScore');
    let adapter = test.split(',');
    let forMemery = [adapter[5],adapter[6],adapter[7],adapter[8]] 
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
    // console.log('9');
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

    if(tens <= 9){
        appendTens.innerHTML = "0" + tens;
    }
    
    if (tens > 9){
        appendTens.innerHTML = tens;
        
    } 
    
    if (tens > 99) {
        seconds++;
        appendSeconds.innerHTML = "0" + seconds;
        tens = 0;
        appendTens.innerHTML = "0" + 0;
    }

    if (seconds > 9){
    appendSeconds.innerHTML = seconds;
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
            blink('example-answer-block','green');
            if(score>=(examplesCount+1)){
                document.getElementById('win-message').outerHTML = `<p id="win-message" class="win-message ">Количество ошибок: ${mistake}<br> Время: ${document.getElementById("seconds").textContent}:${document.getElementById("tens").textContent}</p>`;
                fromExampleToHome();
            }else{
                setExample();
            }
        } else{
            mistake++;
            blink('example-answer-block','red')
        }
    } else if(answerUser.length < 6){
        answerUser += value ;
        input.outerHTML = `<p id="example-answer">${ answerUser }</p>`;
    } else{
        blink('example-answer-block','red')
    }
}

function setExample(){ // создаю пример и вывожу на экран
    // 0+   1-   2x   3/  4t  5+-(min)  6+-(max)  7x/(min)  8x/(max) 

    numberOne = 0;
    numberTwo = 0;
    let symbol
    forScore = localStorage.getItem('forScore').split(',');

    let symbolArray = ['+', '-', '*', '/',];
    for(let i=0;i<5;){ // рандомлю знак из тех что доступны
        symbol = randomNumber(0, 3);
        if(forScore[symbol] == "true"){
            i=10;
        }
    }

    switch(symbol){ // создаю числа для примера
        case 0: // '+'
            numberOne = randomNumber(+forScore[5],+forScore[6]);
            numberTwo = randomNumber(+forScore[5],+forScore[6]);
            answer = numberOne + numberTwo;
        break;
        case 1:// '-'
            numberOne = randomNumber(+forScore[5],+forScore[6]);
            numberTwo = randomNumber(+forScore[5],+forScore[6]);
            let a;
            if(numberOne < numberTwo){
                answer = numberTwo - numberOne;
                a=numberTwo;
                numberTwo = numberOne;
                numberOne = a;
            } else if(numberOne = numberTwo){
                numberOne = numberOne + 1;
                answer = numberOne - numberTwo;
            } else {
                answer = numberOne - numberTwo;
            }
        break;
        case 2:// '*'
            numberOne = randomNumber(+forScore[7],+forScore[8]);
            numberTwo = randomNumber(+forScore[7],+forScore[8]);
            answer = numberOne * numberTwo;
        break;
        case 3:// '/'
            let forSort;
            for(let i =0;i < 1;){
                numberOne = randomNumber(+forScore[7],+forScore[8]);
                numberTwo = randomNumber(+forScore[7],+forScore[8]);
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

    let inputExample = document.getElementById('example');
    inputExample.outerHTML = `<p id="example">${ numberOne } ${ symbolArray[symbol] } ${ numberTwo } = </p>`;
    console.log(answer);

    let inputScore = document.getElementById('score');
    inputScore.outerHTML = `<p id="score">${score}/${examplesCount}</p>`;
}

function randomNumber(min, max){ // генерациия рандомных чисел
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function blink(input, color){ // при проверках подсвечивать правильные или неправильные действия
    let inpu = document.getElementById(input) ;
    inpu.style.backgroundColor = color;
    inpu.style.transition = "0.4s";
    setTimeout(function() {
        inpu.style.backgroundColor = '';
    }, 400);
}

function checkChekBox(value){ // проверка есть ли хоть один закрытый чекбокс
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let a=0;
    for(let i =0;i<4;i++){    
        forScore[i] = checkboxes[i].checked;
        if(checkboxes[i].checked == true){
            a++;
        }
    }
    if(a == 0){
        checkboxes[value].checked = true;
    }
}





document.addEventListener('DOMContentLoaded', () => { // первый заход и разложение сохраненных значений
    let test = localStorage.getItem('forScore');
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