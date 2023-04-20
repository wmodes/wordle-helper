
// Full Grid Wordle-Word Aware Wordle Helper
// Wes Modes
// 2023

const testCases = {
    TREND: { 
        explain: "This test to make sure previous yellows don't disqualify later greens, e.g., 'R' here",
        matrix: "LOVE.R. T:E.AR.S T:R:IBE."
    }
}

// grid class
class Grid {
    static hintHTML = "<div class='hint-text'>Sorted by n-gram frequency score</div>";
    static SCORE_ACCURACY = 2;

    constructor() {
        this.rows = 6;
        this.cols = 5;
        this.currentRow = 0;
        this.currentCol = 0;
        this.cells = [];
        this.absent = [];
        this.present = [];
        this.correct = [];
        this.candidates = [];

        this.clearCells();  
        this.makeGrid();
        this.setPromoteListener();
        this.setKeyListener();
        this.setButtonListener();

        this.watchword = "TRIBE";
    }

    clearCells() {
        // Initialize the grid with empty cells
        for (let i = 0; i < this.rows; i++) {
            this.cells[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.cells[i][j] = { letter: '', state: 'empty' };
            }
        }
    }

    makeGrid() {
        for (let i=0;i<this.rows;i++) {
            let elHTML = `<div class="grid-row row${i}"></div>`;
            let thisRow = $(elHTML);
            $("#grid").append(thisRow);
            for (let j=0;j<this.cols;j++) {
                let elHTML = `<div class="tile tile${j} empty" data-row=${i} data-col=${j}></div>`;
                let thisCell = $(elHTML);
                thisRow.append(thisCell);
            }
            if (i>0) {
                thisRow.hide();
            }
        }
    }

    // listens for clicks on elements
    setPromoteListener() {
        $("#grid .tile").click(this.promoteListener.bind(this))
    }

    promoteListener(event) {
        // cycle: absent, present, correct
        // get coordinaates
        const row = $(event.target).data("row");
        const col = $(event.target).data("col");
        // console.log("row,col: ", row, col, this.cells[row][col].letter, this.cells[row][col].state, $(event.target).data("state"));
        this.promoteCell(row, col);
    }

    promoteCell(row, col) {
        // if no letter value, bail
        if (this.cells[row][col].letter == '') {
            return;
        } 
        // get current status
        const state = this.cells[row][col].state;
        // cycle status
        let newState;
        switch (state) {
            case "absent":
                newState = "present";
                break;
            case "empty":
                newState = "present";
                break;
            case "tbd":
                newState = "present";
                break;
            case "present":
                newState = "correct";
                break;
            case "correct":
                newState = "absent";
                break;
            default:
                break;
        }
        this.#setCellState(row, col, newState);
    }

    promoteLastCell() {
        let lastCellRow = this.currentRow;
        let lastCellCol = this.currentCol;
        // check if removing a row is necessary
        if (lastCellCol - 1 < 0) {
            // check if there are rows left to remove
            if (lastCellRow - 1 < 0) {
                // can't delete more rows
                return (-1);
            } else {
                // remove a row and reset currentCol to this.cols
                lastCellRow--;
                lastCellCol = this.cols - 1;
            }
        } else {
            // decrement currentCol
            lastCellCol--
        }
        this.promoteCell(lastCellRow, lastCellCol)
    }

    // listens for keystrokes and adds them to the grid
    setKeyListener() {
        $(document).keydown(this.keyListener.bind(this));
    }

    keyListener(event) {
        // translate key code into something readable
        const key = event.key.toUpperCase();

        if (key === 'BACKSPACE') {
            // remove previous letter from grid
            this.delLetter();
        } 
        // if it is a letter
        else if (key.length == 1 && key.match(/[A-Z]/)) {
            // add letter to grid
            this.addLetter(key);
        }
    }

    // listens for button presses
    setButtonListener() {
        $("#hints-button").click(this.hintButton.bind(this));
        $("#reset-button").click(this.resetButton.bind(this))
    }

    hintButton() {
        this.summarizeGrid();
        this.filterWords();
    }

    resetButton() {
        let total = this.currentRow * this.cols + this.currentCol;
        for (let i=0;i<total;i++) {
            this.delLetter()
        }
        this.absent = [];
        this.present = [];
        this.correct = [];
        this.candidates = [];
        $("#hints").html('');
    }

    // returns:
    //  1 if it added a row
    //  0 if not
    //  -1 if can't add more rows
    incrCell() {
        // check if adding a row is necessary
        if (this.currentCol + 1 >= this.cols) {
            // check if there are more rows to add
            if (this.currentRow + 1 >= this.rows) {
                // can't add more rows
                return (-1);
            } else {
                // add a new row and reset currentCol to 0
                this.currentRow++;
                this.currentCol = 0;
                return (1);
            }
        } else {
            // increment currentCol
            this.currentCol++;
            return (0);
        }
    }

    // returns:
    //  1 if it added a row
    //  0 if not
    //  -1 if can't add more rows
    decrCell() {
        // check if removing a row is necessary
        if (this.currentCol - 1 < 0) {
            // check if there are rows left to remove
            if (this.currentRow - 1 < 0) {
                // can't delete more rows
                return (-1);
            } else {
                // remove a row and reset currentCol to this.cols
                this.currentRow--;
                this.currentCol = this.cols - 1;
                return 1;
            }
        } else {
            // decrement currentCol
            this.currentCol--
            return (0);
        }
    }
    
    getCell(row, col) {
        return this.cells[row][col];
    }
  
    #setCellLetter(row, col, letter) {
        // set the internal datastructure
        this.cells[row][col].letter = letter;
        this.cells[row][col].state = 'absent';
        // set the visible grid
        var selector = `#grid .row${row} .tile${col}`;
        $(selector).text(letter);
        this.#setClass($(selector), 'absent');
    }
    
    #setCellState(row, col, state) {
        // set the internal datastructure
        this.cells[row][col].state = state;
        // set the visible grid
        var selector = `#grid .row${row} .tile${col}`;
        $(selector).data('state', state);
        // set the class attributes
        this.#setClass($(selector), state);
    }

    #setClass(element, cls) {
        element.removeClass("empty tbd absent present correct");
        element.addClass(cls);

    }

    #delCell(row, col) {
        // set the internal datastructure
        this.cells[row][col] = { letter: '', state: 'empty' }
        // set the visible grid
        var selector = `#grid .row${row} .tile${col}`;
        $(selector).text('');
        this.#setClass($(selector), 'empty');
    }

    addLetter(letter) {
        this.#setCellLetter(this.currentRow, this.currentCol, letter);
        if (this.incrCell() == 1) {
            var selector = `#grid .row${this.currentRow}`
            $(selector).show();
        }
    }

    delLetter() {
        if (this.decrCell() == 1) {
            var selector = `#grid .row${this.currentRow+1}`
            $(selector).hide();
        }
        this.#delCell(this.currentRow, this.currentCol);
    }

    showGrid() {
        let output = "";
        for (let i = 0; i < this.rows; i++) {
          for (let j = 0; j < this.cols; j++) {
            const cell = this.getCell(i, j);
            const letter = cell.letter !== "" ? cell.letter : " ";
            output += `${letter} `;
          }
          output += "\n";
        }
        console.log(output);
    }

    summarizeGrid() {
        this.absent = [];
        this.present = [];
        this.correct = [];
        for (var row=0;row<this.currentRow+1;row++) {
            for (var col=0;col<this.cols;col++) {
                var state = this.cells[row][col].state;   
                var letter = this.cells[row][col].letter;
                switch (state) {
                    case "present":
                        this.present.push({'letter': letter, 'pos': col});
                        break;
                    case "correct":
                        this.correct.push({'letter': letter, 'pos': col});
                        break;
                    // absent, tbd, or empty amount to the same thing
                    default:
                        if (letter !== '') {
                            this.absent.push(letter);
                        }
                        break;
                }
            }
        }
        // make sure we don't have dupes in each array
        this.correct = this.correct.filter((v,i,a)=>a.findIndex(v2=>(JSON.stringify(v2) === JSON.stringify(v)))===i);
        this.present = this.present.filter((v,i,a)=>a.findIndex(v2=>(JSON.stringify(v2) === JSON.stringify(v)))===i)
        this.absent = this.absent.filter((v,i,a)=>a.findIndex(v2=>(JSON.stringify(v2) === JSON.stringify(v)))===i)
        // // remove letters marked present from absent list
        // // this accounts for the posibility of double letters
        // for (var i=0;i<this.present.length;i++) {
        //     this.absent.remove(this.present[i].letter);
        // }
        // // remove letters marked correct from absent list
        // // this accounts for the posibility of double letters
        // for (var i=0;i<this.correct.length;i++) {
        //     this.absent.remove(this.correct[i].letter);
        // }
    }

    isCandidate(word) {
        word = word.toUpperCase();
        let DEBUG = false;
        if (word == this.watchword.toUpperCase()) {
            DEBUG = true;
        }
        let wordArray = word.split('');
        // first, check correctly placed letters
        for (var i=0;i<this.correct.length;i++) {
            var {letter, pos} = this.correct[i];
            if (DEBUG) console.log(letter,pos,wordArray,wordArray[pos]);
            if (wordArray[pos] != letter) {
                // looking at candidate word, 
                // if the known correct pos doesn't have correct letter, 
                // reject it.
                if (DEBUG) console.log(`${word} rejected: ${letter} not in expected place`);
                return false;
            }
            // else {
            //     // blank correctly guessed positions in wordArray
            //     // to take those values out of consideration in next
            //     // two checks
            //     // ^^ this strategy doesn't work because we may have yellows
            //     //    that later turn into greens
            //     wordArray[pos] = '';
            // }
        };
        // next, check present, but incorrectly placed letters
        for (var i=0;i<this.present.length;i++) {
            var {letter, pos} = this.present[i];
            // if word doesn't contain letters on pressent list, nope
            if (DEBUG) console.log(word, wordArray,letter,pos);
            if (!wordArray.includes(letter)) {
                if (DEBUG) console.log(`${word} rejected: doesn't contain ${letter}`);
                return false;
            } 
            // if word contains letters on present list, but in yellow pos, reject it
            else if (wordArray[pos] == letter) {
                if (DEBUG) console.log(`${word} rejected: contains ${letter} but in wrong position`);
                return false;
            }
        }
        if (DEBUG) console.log(`${word} still a candidate`);
        // if we've gotten here the letter is present in candidate word,
        // but not in pos marked yellow
        // so we find the letter and remove it from consideration
        for (var i=0;i<this.present.length;i++) {
            wordArray[wordArray.indexOf(letter)] = '';
        }
        // finally, we deal with absent letters
        for (var i=0;i<this.absent.length;i++) {
            var letter = this.absent[i];
            // if word contains letters on absent list, nope
            // doesn't account for repeat letters
            if (wordArray.includes(letter)) {
                if (DEBUG) console.log(`${word} rejected: contained ${letter}`);
                return false;
            }
        }
        return true;
    }

    filterWords() {
        this.candidates = [];
        $("#hints").html(Grid.hintHTML);
        $("#hints").append("<div class='word-list'></div>");
        for (var i=0;i<WORDSCORELIST.length;i++) {
            var word = WORDSCORELIST[i].word;
            var score = (WORDSCORELIST[i].score * 100).toFixed(Grid.SCORE_ACCURACY);
            var results = this.isCandidate(word);
            if(results) {
                this.candidates.push(word);
                $("#hints .word-list").append(
                    `<div class="hint">${word}<span class="score">${score}</span></div>`)
            }
        }
    }

    buildTestcase(key) {
        if (! key in testCases) {
            console.log(`Error: ${key} not found in testCases`);
            return 1;
        }
        key = key.toUpperCase();
        let testCase = testCases[key];
        console.log("Test Case:", key);
        console.log(testCase.explain);
        this.watchword = key;
        this.resetButton();
        for (var i=0; i<testCase.matrix.length; i++) {
            let letter = testCase.matrix[i].toUpperCase();
            if (letter == '.'  || letter == ':') {
                continue;
            } 
            else if (letter.match(/[A-Z]/)) {
                this.addLetter(letter);
                // if we are not at the last letter, 
                if (i !== testCase.matrix.length - 1) {
                    // check if letter gets a promotion
                    if (testCase.matrix[i + 1] == '.') {
                        this.promoteLastCell();
                    } 
                    else if (testCase.matrix[i + 1] == ':') {   
                        this.promoteLastCell();
                        this.promoteLastCell();
                    } 

                }
            }
        }
    }
}

// helpers

Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

// Getting things rolling

let grid = new Grid();

// add a keyboard for mobile users

$(document).on("click",function() {
    // console.log("Here's a keyboard for you!");
    $('#dummy-input').focus();
});

// various buttons and such

$("#help-button").click(function(){
    // select a random tip from the array
    var randomTip = tips[Math.floor(Math.random() * tips.length)];
    $("#coffee-link").html(randomTip);
    $("#modal-container").show()
})

$('button.modal-exit').click(function(){
    $("#modal-container").hide()
})

$("#settings-button").click(function(){
    $("body").toggleClass("dark");
})

tips = [
    "buy me a gram of cocaine",
    "buy me a cup of coffee",
    "buy me a beer",
    "buy me a discount airline ticket to Hawaii",
    "buy me a slice of pizza",
    "buy me a box of chocolates",
    "buy me a bouquet of flowers",
    "buy me a ticket to the movies",
    "buy me a book",
    "buy me a subscription to a magazine",
    "buy me a video game",
    "buy me a new pair of shoes",
    "buy me a massage",
    "buy me a bottle of wine",
    "buy me a piece of artwork",
    "buy me a fancy dinner",
    "buy me a new album",
    "buy me a pair of sunglasses",
    "buy me a ticket to a concert",
    "buy me a box of donuts",
    "buy me a new piece of jewelry",
    "buy me a houseplant",
    "buy me a new phone case",
    "buy me a yoga class",
    "buy me a new hat",
    "buy me a car wash",
    "buy me a bike lock",
    "buy me a fancy haircut",
    "buy me a new handbag",
    "buy me a cooking class",
    "buy me a new watch",
    "buy me a fancy pen",
    "buy me a new jacket",
    "buy me a day at the spa",
    "buy me a new coffee mug",
    "buy me a new candle",
    "buy me a box of tea",
    "buy me a new hat",
    "buy me a concert ticket",
    "buy me a new board game",
    "buy me a new deck",
    "buy me a limited edition vinyl record",
	"buy me a vintage typewriter",
	"buy me a handcrafted wooden chess set",
	"buy me a set of calligraphy pens and ink",
	"buy me a virtual reality headset",
	"buy me a weekend getaway to a secluded cabin",
	"buy me a personalized Bob Ross painting class",
	"buy me a hot air balloon ride",
	"buy me a full day of skydiving lessons",
	"buy me a year's supply of artisanal cheese",
	"buy me a guided trip to explore abandoned places",
	"buy me a set of professional-grade cookware",
	"buy me a tour of haunted places in the city",
	"buy me a personalized tarot card reading session",
	"buy me a visit to a psychic medium",
	"buy me a month's subscription to a snack box service",
	"buy me a custom-made cosplay costume",
	"buy me a personal assistant for a day",
	"buy me a helicopter tour of the city",
	"buy me a private tour of a museum after hours",
	"buy me a professional photoshoot with a theme of my choice",
	"buy me a box of rare and exotic fruits",
	"buy me a voice training session with a vocal coach",
	"buy me a personalized workout and nutrition plan",
	"buy me a professional massage chair for my home office",
    "buy me a private island in the Caribbean",
	"buy me a vintage Rolls Royce",
	"buy me a first-class round-trip ticket to the International Space Station",
	"buy me a life-sized statue of myself made entirely of gold",
	"buy me a week-long safari in Africa with a personal guide and chef",
	"buy me a custom-built treehouse with all the amenities of a luxury hotel room",
	"buy me a private concert by my favorite musician in a venue of my choice",
	"buy me a hot air balloon ride over the Grand Canyon",
	"buy me a custom-designed dress by a famous fashion designer",
	"buy me a fully-equipped professional-grade recording studio"
]

// the following aren't used by the wordle helper, but are here to score all the words offline
//

class Scores {
    static ngramDepth = 4;

    constructor(wordlist) {
        this.wordlist = wordlist;

        // main list
        this.mainWordList = {};
        this.createMasterWordList();

        // freq charts
        this.freqChart = {};

        for (var n=2; n<=Scores.ngramDepth; n++) {
            this.createNGramFreqChart(n);
            this.scoreWordsByNgram(n);
        }

        // final score
        this.scoreWordsByAll(Scores.ngramDepth);
        this.printScoredList();
    }

    createMasterWordList() {
        for (var i=0; i<this.wordlist.length; i++) {
            this.mainWordList[this.wordlist[i]] = {
                scores: {},
                freq: {}
            };
        }
    }

    countNGrams(word, n) {
        const nGramCounts = {};
        for (let i = 0; i <= word.length - n; i++) {
          const ngram = word.slice(i, i + n);
          if (ngram in nGramCounts) {
            nGramCounts[ngram]++;
          } else {
            nGramCounts[ngram] = 1;
          }
        }
        return Object.entries(nGramCounts).map(([ngram, count]) => ({ ngram, count }));
    }

    createNGramFreqChart(n) {
        // count combos
        var countChart = {};
        // keep track of highest count
        var maxCount = 1;
        for (const word of this.wordlist) {
            // get n-combos for this word
            var ngrams = this.countNGrams(word, n);
            // console.log(word,combos);
            // add these n-combos and counts to mainWordList
            this.mainWordList[word].freq[n] = ngrams;
            for (const ngram of ngrams) {
                // console.log("ngram", ngram.ngram, "count", ngram.count);
                if (countChart[ngram.ngram] === undefined) {
                    countChart[ngram.ngram] = ngram.count;
                } 
                // otherhwise increment it
                else {
                    countChart[ngram.ngram] += ngram.count;
                    maxCount = Math.max(maxCount, countChart[ngram.ngram]);
                }
            }
        }
        // Normalize each value to between 0 and 1
        this.freqChart[n] = {};
        for (const ngram in countChart) {
            // console.log(ngram);
            this.freqChart[n][ngram] = countChart[ngram] / maxCount;
        }
    }

    scoreWordByNgram(word, n) {
        var score = 1;
        var nGramList = this.mainWordList[word].freq[n];
        // var count = 0;
        // console.log(nComboList);
        for (const ngram of nGramList) {
            score *= this.freqChart[n][ngram.ngram] ** ngram.count;
            // count += nComboList[i].count;   
            // score +=  nComboList[i].count * this.ncomboFreqChart[nComboList[i].combo]
        }
        return score;
    }

    scoreWordsByNgram(n) {
        for (const word of this.wordlist) {
            var nGramScore = this.scoreWordByNgram(word, n);
            this.mainWordList[word].scores[n] = nGramScore;
        }
    }
   
    scoreWordsByAll(n) {
        for (let key in this.mainWordList) {
            let value = this.mainWordList[key];
            const values = Object.values(value.scores);
            const product = values.reduce((total, value) => total * value, 1);
            const sum = values.reduce((total, value) => total + value, 0);
            const avg = sum / values.length;
            this.mainWordList[key].scores[0] = product;
        }
    }

    printScoredList() {
        let list = [];
        for (const word in this.mainWordList) {
            list.push({word: word, score: this.mainWordList[word].scores[0]});
        }
        list.sort((a, b) => b.score - a.score);
        console.log(JSON.stringify(list, null, 2));
    }

}