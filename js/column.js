// Generate text columns with a custom "uit" syntax
// "uit" stands for "ultra inefficient tags" xD
const column = (string) => {
  const lines = string.split("%nl");
  if (lines.at(-1) === "") lines.pop();

  // Check if there is % tags, else return
  for (const element of lines.map((string) => {
    return string.search("%pd") === -1 ? false : true;
  })) {
    if (!element) {
      return "";
    }
  }

  // Split words between % tags
  let words = [];
  lines.forEach((string) => {
    let lineCopy = string;
    let wordsTemp = [];
    while (true) {
      if (lineCopy.search("%pd") === -1) break;
      const pdOpen = lineCopy.search(/%pd/g) + 3;
      const pdClose = lineCopy.search(/pd%/g);
      if (wordsTemp);
      wordsTemp.push(lineCopy.slice(pdOpen, pdClose));
      lineCopy = lineCopy.slice(pdClose + 3);
    }
    words.push(wordsTemp);
  });

  // Determine the longest string
  let maxLengthWord = [];
  words[0].forEach(() => {
    maxLengthWord.push(0);
  });

  words.forEach((element) => {
    element.forEach((string, index) => {
      if (string.length > maxLengthWord[index])
        maxLengthWord[index] = string.length;
    });
  });

  // Slice sting into an array
  let finalString = [];
  words.forEach((element, index) => {
    const stringTemp = [];
    let prevEndOfString = 0;
    element.forEach((string, index2) => {
      const startOfString = lines[index].search(string);
      const endOfString = startOfString + string.length;
      stringTemp.push(lines[index].slice(prevEndOfString, endOfString));
      if (!element[index2 + 1])
        stringTemp.push(lines[index].slice(endOfString));

      prevEndOfString = endOfString;
    });
    finalString.push(stringTemp);
  });

  // Append HTML spaces
  const stringPadding = 5;
  finalString = finalString.map((line, index) => {
    let stringTemp = "";
    line.forEach((string, index2) => {
      if (line[index2 + 1]) {
        let HTMLSpaces = "";
        const wordLength = words[index][index2].length;
        for (
          let i = 0;
          i < maxLengthWord[index2] + stringPadding - wordLength;
          i++
        ) {
          HTMLSpaces += "&ensp;";
        }
        stringTemp += `${string}${HTMLSpaces}`;
      } else {
        stringTemp += string;
      }
    });
    return stringTemp;
  });

  // Add <br> tag at the end of each line
  finalString = finalString.map((string) => `${string}<br>`);

  // Remove % tag and return string :)
  return finalString.join("").replace(/%pd/g, "").replace(/pd%/g, "");
};

export { column };
