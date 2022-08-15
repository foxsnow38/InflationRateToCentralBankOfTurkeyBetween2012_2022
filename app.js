import axios from "axios"
import  {parseString} from 'xml2js'
import fs  from "fs"
import iconvlite  from "iconv-lite"
let yearLoop =11 
let axiosDataCheck = async (year,month,day) =>{
 let result,status =false, dayIndex = day // bir degisken olarak alıyorum dayı zamanında bir hata le karsılattıgımı hatırlayım garantilemek için

try{
   result  = await axios(`https://www.tcmb.gov.tr/kurlar/${year}${month}/${day}${month}${year}.xml`,{
	headers: {
	  'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
      'accept-encoding': 'gzip, deflate, br',
      'content-type': 'text/css; charset=utf-8',
      'accept':' text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'accept-language': 'tr,en;q=0.9,en-GB;q=0.8,en-US;q=0.7',
      
    }, // header ayarları 
    responseType: "arraybuffer" // buffer Olarak alıyorum Turkce karakterler olduğu ıcın
    }
)
}
catch(e){  
 
    result  =    await axiosDataCheck(year,month,parseInt(dayIndex)+1) // eger 404 hatasi verirse fonksiyon icinde kendi fonk cagirarak donguye sokuyorum.
}

return  result
}


const converXmlToString= async (year,month,day)=>{
    let  result =await axiosDataCheck(year,month,day) // axıosla yukarıdan  data cekıyoruz
    
    console.log(`${day}-${month}-${year}`) // nerede oldugunu anlamanız için
   
    result = iconvlite.decode(result.data, 'iso-8859-9') // gelen buffer datayı turkce karakterler ile tekrar yazıyorum İSO 8859 formatını bulmak biraz uğraştırdı
   
    let jsonData
    await parseString(result, function (err, result) {jsonData =result}); // xml i json a ceviriyorum
    return jsonData  //artık gelen datayı dönüyorum.
}

const takeFromCurrency = async () =>{ // 
    let currencyDatas = []
    let year= 2012 ,month= 8, day= 10
for (let index = 0; index <yearLoop; index++) { // klasik for en iyisi

 let a =  await  converXmlToString(`${year}`,`${String(month).length==1?`0`+`${month}`:`${month}` /*basına 0 koyamıyorum o yuzden 1 adetse dıye kontrol edıyorum */ }`,`${day}`)


   currencyDatas.push(a) // index gonderince strict mode hatasi veriyor.
    year++
}
// fs.writeFileSync(`index.html`,(`<html>${JSON.stringify(currencyDatas)}</html>`))
return currencyDatas
}
const findBeforePrice = (obj,currencyCode)=>{

// console.log(obj["Tarih_Date"].Currency[1]["$"].CurrencyCode)
// const filteredData = Object.entries(obj["Tarih_Date"].Currency).filter(console.log((item,index)=>item[index]["$"].CurrencyCode))
const filteredData = Object.entries(obj["Tarih_Date"].Currency).filter((item,index)=>item[1]["$"].CurrencyCode == currencyCode)

 if( filteredData[0] == undefined)  return null
 else return filteredData[0][1]
}

const calcInflation = async () =>{
let  arrayData = await  takeFromCurrency()
// let arrayData = JSON.parse(fs.readFileSync('json.txt','utf-8'))
// findBeforePrice(arrayData[2],"USD")

for (let index = 1; index < yearLoop; index++) {

  for (let currencyIndex = 0; currencyIndex <arrayData[index]["Tarih_Date"].Currency.length; currencyIndex++) {

    let inflation

    let afterDataCurrencyCode =   arrayData[index]["Tarih_Date"].Currency[currencyIndex]['$'].CurrencyCode

    let afterData =   arrayData[index]["Tarih_Date"].Currency[currencyIndex].ForexSelling
    let beforeData = findBeforePrice(arrayData[index-1] , afterDataCurrencyCode)?.ForexSelling
    if (beforeData==null) inflation=`Unknown`
    else{
         beforeData =     parseFloat(beforeData[0]).toFixed(2)
         afterData=   parseFloat(afterData[0]).toFixed(2)
        inflation = `${(((afterData -beforeData)/afterData)*100).toFixed(2)}%`

    }
    
    arrayData[index]["Tarih_Date"].Currency[currencyIndex]= {...arrayData[index]["Tarih_Date"].Currency[currencyIndex],Inflation:inflation}

    
  }    
}

fs.writeFileSync(`index.html`,`${JSON.stringify(arrayData)}`)

}
  
calcInflation()
setInterval(() => {
  
    
}, 1000*60*60*24);
