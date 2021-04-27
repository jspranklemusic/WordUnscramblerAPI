const app = require('express')()
const fs = require('fs')
const bodyParser= require('body-parser')
const axios = require('axios').default;
const cheerio = require('cheerio');

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
  res.set("Content-Type","text/html")
  res.send(Buffer.from(`
  <style>
  h1{
    text-align:center;
  }
  body{
    padding:2rem;
  }
  p{
    min-width:300px;
    width:50%;
    margin:auto;
  }
  </style>
  <title>Word Unscrambler API</title>
  <body>
     <h1>Word Unscrambler API</h1>
  <p><em>Algorithms and API by Josiah Sprankle</em></p>
  <br>
  
  <p>
  <a href="https://github.com/jspranklemusic/WordUnscramblerAPI">Github Page</a><br><br>
    This is an API to unscramble words, return all possibilities and substrings of a string, and search words in a dictionary. To use this API, the routes are:
<br><br>
/dictionary/yourword --- (returns the definitions)
<br><br>
/trees/yourword --- (returns every single possible combination, substring, and slice of your word in every possible order.... this is a very expensive algorithm, so I have limited the usage to 7 characters.)
<br><br>
/unscramble/yourword --- This will return all possible words, but will include a couple of non-stardard words and abbreviations.
<br><br>
/deep-unscramble/yourword --- This will return all possible words and check them against the Merriam-Webster dictionary website to ensure that the words are valid. This takes much longer, but will be more accurate if you are patient.
<br>

    </p>
  </body>
 
  `))
})

app.get('/unscramble/:word',async (req,res)=>{
    if(req.params.word.length>7){
        return res.json("Whoops! Your word has to be 7 letters max.")
    }
    const possibilities =  returnPossibilities(req.params.word)
    const fullwords = parseDictionary(possibilities,dictionary);
    res.json(fullwords);
})

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



app.get('/trees/:word',(req,res)=>{
    if(req.params.word.length>7){
        return res.json("Whoops! Your word has to be 7 letters max.")
    }
    res.json(returnPossibilities(req.params.word))
    
})

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

