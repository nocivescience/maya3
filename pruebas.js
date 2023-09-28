Math.minmax = function (value, limit) {
    return Math.min(Math.max(value, -limit), limit);
};
Math.maxmin = function (value, limit) {
    return Math.max(Math.min(value, limit), -limit);
};

const caso1=Math.minmax(12,7);
const caso2=Math.maxmin(12,7);
console.log(caso1===caso2);