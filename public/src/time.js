const
    Millisecond = 1,
    Second = 1000 * Millisecond,
    Minute = 60 * Second,
    Hour = 60 * Minute;

class Duration {

    constructor(ms) {
        this.ms = ms;
    }

    toString() {
        let ms = this.ms;
        let str = '';
        
        let s = Math.floor(ms / Second);
        let m = Math.floor(ms / Minute);
        let h = Math.floor(ms / Hour);
    
        if (ms > 0) {
            str += (ms % 1000).toString() + 'ms';
        } else {
            str = '0ms';
        }
    
        if (s > 0) {
            str = (s % 60).toString() + 's' + str;
        }
    
        if (m > 0) {
            str = (m % 60).toString() + 'm' + str;
        }
    
        if (h > 0) {
            str = h.toString() + 'h' + str;
        }
    
        return str;    
    }
}

export {
    Duration,
}
