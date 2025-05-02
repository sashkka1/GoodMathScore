let a = [];

while (a.length <= 30) {
    let subArray = [
        Math.floor(Math.random() * 6) + 7, // от 5 до 10
        Math.floor(Math.random() * 6) + 7,
        Math.floor(Math.random() * 6) + 7
    ];
    a.push(subArray);
}
console.log('a',a[1][0]);
let arrayGraph=[];
for (let i = 1; i <= 30; i++) {
    arrayGraph.push({
        day: String(i),
        time: a[i][0],
        examples: a[i][1],
        mistake: a[i][2],
    });
}
console.log('arrayGraph',arrayGraph);
new Morris.Line({
    element: 'month',
    data: arrayGraph,
    xkey: 'day',
    parseTime: false,
    ykeys: ['time','mistake','examples'],
    hideHover: 'always',
    labels: ['time','mistake','examples'],
    lineColors: ['blue','red','green']
});