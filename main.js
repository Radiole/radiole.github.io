function RNG(seed) {
    // LCG using GCC's constants
    this.m = 0x80000000; // 2**31;
    this.a = 1103515245;
    this.c = 12345;
  
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
}
RNG.prototype.nextInt = function() {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
}
RNG.prototype.nextFloat = function() {
    // returns in range [0,1]
    return this.nextInt() / (this.m - 1);
}
RNG.prototype.nextRange = function(start, end) {
    // returns in range [start, end): including start, excluding end
    // can't modulu nextInt because of weak randomness in lower bits
    var rangeSize = end - start;
    var randomUnder1 = this.nextInt() / this.m;
    return start + Math.floor(randomUnder1 * rangeSize);
}
RNG.prototype.choice = function(array) {
    return array[this.nextRange(0, array.length)];
}

var today;
var guesses = 0;
var daily = false;

const seenTutorial = document.cookie
    .split('; ')
    .find((row) => row.startsWith('seenTutorial='))
    ?.split('=')[1];

if (seenTutorial === 'true') {
    $('#howtoplay').hide();
    $('#revealhowtoplay').show();
} else {
    $('#howtoplay').show();
    $('#revealhowtoplay').hide();
}

const playedToday = document.cookie
    .split('; ')
    .find((row) => row.startsWith('playedToday='))
    ?.split('=')[1];

if (playedToday === 'true') {
    today = SONGS[Math.floor(Math.random() * SONGS.length)];
} else {
    let rng = new RNG(Math.floor(new Date() / 8.64e7));
    today = rng.choice(SONGS);
    daily = true;
}


function search(input) {
    let root = document.getElementById('search');
    root.innerHTML = '';

    if (input.value !== '') {
        root.style.display = 'block';
    } else {
        root.style.display = 'none';
    }

    let searchResults = SONGS.sort((a, b) => jaro_winkler.distance(b.title, input.value) - jaro_winkler.distance(a.title, input.value));

    for (i in searchResults.slice(0, 5)) {
        let div = document.createElement('div');
        div.innerHTML = SONGS[i].title;
        div.setAttribute('onclick', 'guess(this.innerHTML)');
        root.appendChild(div);
    }
}

function guess(title) {
    document.getElementById('search').style.display = 'none';
    document.getElementById('searchbar').value = '';

    let table = document.getElementById('guesses');
    for (i in SONGS) {
        let song = SONGS[i];

        if (song.title === title) {
            let row = table.insertRow(table.length);

            let noCell = row.insertCell(0);
            noCell.innerHTML = song.no;
            if (song.no === today.no) { noCell.classList.add('green'); }
            else if (Math.abs(song.no - today.no) <= 3) { noCell.classList.add('yellow') }
            if (song.no < today.no) { noCell.classList.add('up') }
            else if (song.no > today.no) { noCell.classList.add('down') }

            let titleCell = row.insertCell(1);
            titleCell.innerHTML = song.title;
            if (song.title === today.title) { titleCell.classList.add('green'); }

            let albumCell = row.insertCell(2);
            albumCell.innerHTML = ALBUMS[song.album];
            if (song.album === today.album) { albumCell.classList.add('green'); }
            else if (Math.abs(song.album - today.album) <= 2) { albumCell.classList.add('yellow'); }
            if (song.album < today.album) { albumCell.classList.add('up') }
            else if (song.album > today.album) { albumCell.classList.add('down') }

            let lengthCell = row.insertCell(3);
            lengthCell.innerHTML = sec2min(song.length);
            if (song.length === today.length) { lengthCell.classList.add('green'); }
            else if (Math.abs(song.length - today.length) <= 30) { lengthCell.classList.add('yellow'); }
            if (song.length < today.length) { lengthCell.classList.add('up') }
            else if (song.length > today.length) { lengthCell.classList.add('down') }
        }
    }

    if (today.title === title) {
        $('#searchbar').parent().hide();
        $('#search').parent().hide();
        $('#guesses').hide();
        $('footer').hide();
        $('#searchbar').parent().hide();
        $('#searchbar').parent().hide();
        $('#searchbar').parent().hide();

        document.getElementById('correct').style.display = 'block';
        document.getElementById('correctorno').innerHTML = 'Correct';
        document.getElementById('correctTitle').innerHTML = today.title + (daily ? '<br>(Daily Song)' : '');
        document.getElementById('correctImg').src = COVERS[today.album];
        
        if (daily) {
            let tommorow = new Date();
            tommorow.setDate(new Date().getDate() + 1);
            document.cookie = 'playedToday=true;expires=' + tommorow.toUTCString();
        }
    } else {
        guesses += 1;
        document.getElementById('searchbar').placeholder = `Guess (${guesses + 1}/6)`;

        if (guesses >= 6) {
            $('#searchbar').parent().hide();
            $('#search').parent().hide();
            $('#guesses').hide();
            $('footer').hide();
            $('#searchbar').parent().hide();
            $('#searchbar').parent().hide();
            $('#searchbar').parent().hide();

            document.getElementById('correct').style.display = 'block';
            document.getElementById('correctorno').innerHTML = 'Game Over';
            document.getElementById('correctTitle').innerHTML = today.title;
            document.getElementById('correctImg').src = COVERS[today.album];
        }
    }
}

function sec2min(seconds) {
    return Math.floor(seconds / 60).toString() + ":" + (seconds % 60).toLocaleString("en-US", { minimumIntegerDigits: 2 });
}



var jaro_winkler = {};

/* JS implementation of the strcmp95 C function written by
Bill Winkler, George McLaughlin, Matt Jaro and Maureen Lynch,
released in 1994 (http://web.archive.org/web/20100227020019/http://www.census.gov/geo/msb/stand/strcmp.c).

a and b should be strings. Always performs case-insensitive comparisons
and always adjusts for long strings. */
jaro_winkler.distance = function (a, b) {

    if (!a || !b) { return 0.0; }

    a = a.trim().toUpperCase();
    b = b.trim().toUpperCase();
    var a_len = a.length;
    var b_len = b.length;
    var a_flag = []; var b_flag = [];
    var search_range = Math.floor(Math.max(a_len, b_len) / 2) - 1;
    var minv = Math.min(a_len, b_len);

    // Looking only within the search range, count and flag the matched pairs. 
    var Num_com = 0;
    var yl1 = b_len - 1;
    for (var i = 0; i < a_len; i++) {
        var lowlim = (i >= search_range) ? i - search_range : 0;
        var hilim = ((i + search_range) <= yl1) ? (i + search_range) : yl1;
        for (var j = lowlim; j <= hilim; j++) {
            if (b_flag[j] !== 1 && a[j] === b[i]) {
                a_flag[j] = 1;
                b_flag[i] = 1;
                Num_com++;
                break;
            }
        }
    }

    // Return if no characters in common
    if (Num_com === 0) { return 0.0; }

    // Count the number of transpositions
    var k = 0; var N_trans = 0;
    for (var i = 0; i < a_len; i++) {
        if (a_flag[i] === 1) {
            var j;
            for (j = k; j < b_len; j++) {
                if (b_flag[j] === 1) {
                    k = j + 1;
                    break;
                }
            }
            if (a[i] !== b[j]) { N_trans++; }
        }
    }
    N_trans = Math.floor(N_trans / 2);

    // Adjust for similarities in nonmatched characters
    var N_simi = 0; var adjwt = jaro_winkler.adjustments;
    if (minv > Num_com) {
        for (var i = 0; i < a_len; i++) {
            if (!a_flag[i]) {
                for (var j = 0; j < b_len; j++) {
                    if (!b_flag[j]) {
                        if (adjwt[a[i]] === b[j]) {
                            N_simi += 3;
                            b_flag[j] = 2;
                            break;
                        }
                    }
                }
            }
        }
    }

    var Num_sim = (N_simi / 10.0) + Num_com;

    // Main weight computation
    var weight = Num_sim / a_len + Num_sim / b_len + (Num_com - N_trans) / Num_com;
    weight = weight / 3;

    // Continue to boost the weight if the strings are similar
    if (weight > 0.7) {
        // Adjust for having up to the first 4 characters in common
        var j = (minv >= 4) ? 4 : minv;
        var i;
        for (i = 0; (i < j) && a[i] === b[i]; i++) { }
        if (i) { weight += i * 0.1 * (1.0 - weight) };

        // Adjust for long strings.
        // After agreeing beginning chars, at least two more must agree
        // and the agreeing characters must be more than half of the
        // remaining characters.
        if (minv > 4 && Num_com > i + 1 && 2 * Num_com >= minv + i) {
            weight += (1 - weight) * ((Num_com - i - 1) / (a_len * b_len - i * 2 + 2));
        }
    }

    return weight

};

// The char adjustment table used above
jaro_winkler.adjustments = {
    'A': 'E',
    'A': 'I',
    'A': 'O',
    'A': 'U',
    'B': 'V',
    'E': 'I',
    'E': 'O',
    'E': 'U',
    'I': 'O',
    'I': 'U',
    'O': 'U',
    'I': 'Y',
    'E': 'Y',
    'C': 'G',
    'E': 'F',
    'W': 'U',
    'W': 'V',
    'X': 'K',
    'S': 'Z',
    'X': 'S',
    'Q': 'C',
    'U': 'V',
    'M': 'N',
    'L': 'I',
    'Q': 'O',
    'P': 'R',
    'I': 'J',
    '2': 'Z',
    '5': 'S',
    '8': 'B',
    '1': 'I',
    '1': 'L',
    '0': 'O',
    '0': 'Q',
    'C': 'K',
    'G': 'J',
    'E': ' ',
    'Y': ' ',
    'S': ' '
}
