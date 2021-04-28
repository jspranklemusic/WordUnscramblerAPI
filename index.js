const express = require('express')
const app = express();
const fs = require('fs')
const bodyParser= require('body-parser')
const axios = require('axios').default;
const cheerio = require('cheerio');

app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded())

//word unscrambler functions

function returnPossibilities(word){
    //This returns all character combinations of a word of a given length, but only in that length.
    function findArrayCombos(word){
        let combinations=[]
        function iterateOnce(word){
            for(let j in word){
                for(let i in word){
                    let str = word.split("")
                    let swap = str[j]
                    str[j] = str[i]
                    str[i]=swap
                    let newStr = str.join("")
                    if(!combinations.includes(newStr)){
                        combinations.push(newStr)
                    }
                }
            } 
        }
        iterateOnce(word)
        console.log(combinations.length)
        for(let i=0;i<combinations.length;i++){
            iterateOnce(combinations[i])
        }
        return combinations
    }

    //This returns all possible slices/trees of a word. I.e., "Banana" -> Banan, Banaa, Bnana, Bana, etc.
    function possibileTrees(str){
        let possibilities=[]

        function recursive(str){
                for(let i=0;i<=str.length;i++){
                    let sliced = str.slice(0,str.length-i) + str.slice((str.length-i+1), str.length)
                    if(!possibilities.includes(sliced)&&sliced) possibilities.push(sliced)
                }
        }
        recursive(str)
        //This is recursive because it continuously increases the length of the possibilities each
        //time the function is run, until it reaches the end.
        for(let i=0;i<possibilities.length;i++){
            recursive(possibilities[i])
        }
        return possibilities
    }

    let trees = possibileTrees(word)
    let words =[]
    trees.forEach(tree=>{
        words.push(findArrayCombos(tree))
    })
    return words
}

//to get actual definitions (not just to check if word exists) the word must be checked by scraping a dictionary.
async function scrapeDictionary(word="camp"){
    const response = await axios.get('https://www.merriam-webster.com/dictionary/'+word).catch(err=>{
    });
 
    if(!response) return;
    const obj = {};
    const $ = cheerio.load(response.data);
    word = [];
    let inc = 1;
    while(true){
      const element = $("#dictionary-entry-"+inc);
      if(element.length){
        let $ = cheerio.load( element.html() );
        $(".dtText").each((ind, elem)=>{
          word.push($(elem).text().replace(/\n|\s\s+/g," "))
        })
        inc++;
      }else{
        break;
      }
    }
  if(word.length == 0){
    return null;
  }else{
    return word;
  }
}


    
function parseDictionary(jumbledWords,dict){
    //jumbledWords is an array of arrays, with each array having all
    //combinations of words of a given length, progressively getting smaller
    let validWords=[]
    jumbledWords.flat().forEach(jumbledWord=>{
        if(dict.hasOwnProperty(jumbledWord)){
            validWords.push(jumbledWord)
        }
    })
    return validWords
}

//the dictionary does not contain definitions, only a word list. 
let rawdata = fs.readFileSync('dictionary.json');
const dictionary = JSON.parse(rawdata);

app.get('/',(req,res)=>{
  res.sendFile("index.html");
})


//unscramble an individual word
app.get('/unscramble/:word',async (req,res)=>{
    if(req.params.word.length>7){
        return res.json("Whoops! Your word has to be 7 letters max.")
    }
    const possibilities =  returnPossibilities(req.params.word)
    const fullwords = parseDictionary(possibilities,dictionary);
    res.json(fullwords);
})



//get all the possibilities, check them against the messy dictionary,
//and then send a bunch of http requests to check them against the official dictionary.
app.get("/deep-unscramble/:word",async(req,res)=>{
   if(req.params.word.length>7){
        return res.json("Whoops! Your word has to be 7 letters max.")
    }
    const possibilities =  returnPossibilities(req.params.word)
    const fullwords = parseDictionary(possibilities,dictionary);
    const newArr = []

    async function filterThroughRequests(arr=[], i=0, newArr=[]){
      if(i >= arr.length){
        return newArr;
      }else{
        const response = await axios.get('https://www.merriam-webster.com/dictionary/'+arr[i]).catch(err=>{});
        if(response){
          newArr.push(arr[i])
        }
        return filterThroughRequests(arr, i+1, newArr)
      }
    }

    const filteredResults = await filterThroughRequests(fullwords);
    res.json(filteredResults);
})




//get every possible substring combination of a string
app.get('/trees/:word',(req,res)=>{
    if(req.params.word.length>7){
        return res.json("Whoops! Your word has to be 7 letters max.")
    }
    res.json(returnPossibilities(req.params.word))
    
})



//check if an array of words are scrabble words
app.post('/scrabble',async(req,res)=>{
  if(!req.body | !req.body.words | req.body.words.length){
    res.status(400).send("Must have a valid array with a length greater than 0.")
  }

  async function checkScrabble(arr=[], i = 0, newArr=[]){
    if(i >= arr.length){
      return newArr;
    }
    const response = await axios.get('https://scrabblewordfinder.org/dictionary/'+arr[i]);
    const $ = cheerio.load(response.data);
    const result = $('h3').text();
    
    if(result == "Yes") {
      newArr.push(arr[i]);
      res.write(arr[i])
    }
    return checkScrabble(arr, i+1, newArr);
  }

  const scrabbleWords = await checkScrabble(req.body.words)

  res.end();
})



//check if an individual word is a scrabble word
app.get('/scrabble/:word',async(req,res)=>{
  res.send(req.body.word);
})


//check if a word is in the Merriam Webster Dictionary via web scraping
app.get('/dictionary/:word', async (req,res)=>{
    let result = dictionary[req.params.word]
    if(result){
        const word = await scrapeDictionary(req.params.word);
        res.json(word);
        
    }else{
        res.send("Hmmm... I can't find that word!")
    }
})

app.listen(3000,()=>{
    console.log('listening on port 3000')
})

