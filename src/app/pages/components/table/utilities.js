import moment from "moment";

const Utilities = () => {
  /*Valid if the value is a number*/
  const isNumber = (value) => {
    return /^[0-9]+([\.\,])?[0-9]+$/.test(value);
  };

  /**
   * It takes a date string and returns a moment object.
   * @param value - The value to be parsed.
   * @returns A moment object.
   */
  const parseDate = (value, format) => {
    let date = moment(value, format);

    return date;
  };

  /**
   * It returns a number if the value is a number, a date if the value is a date, and a string if the
   * value is a string
   * @param value - The value of the cell (type string).
   * @returns a value that is either a number, a date, or a string.
   */
  const getSortValue = (value, dateFormat) => {
    let result = null;

    if (isNumber(value)) {
      result = parseFloat(value.replace(",", "."));
    } else {
      let date = parseDate(value, dateFormat);
      if (date.isValid()) {
        result = date.toDate();
      } else {
        result = value.toUpperCase();
      }
    }

    return result;
  };

  /**
   * It takes an array of JSON objects and returns an array of arrays.
   * @param jsonArray - The array of JSON objects that you want to convert to a 2D array.
   * @returns An array of arrays.
   */
  const getDataFromJSON = async (jsonArray) => {
    let result = [];
    let i = 0;
    let isArray = false;

    while (i < jsonArray.length && !isArray) {
      let array = [];
      if (!Array.isArray(jsonArray[i])) {
        Object.entries(jsonArray[i]).map((row) => {
          return array.push(row[1]);
        });
        result.push(array);
      } else {
        isArray = true;
        result = jsonArray;
      }
      i += 1;
    }

    return result;
  };

  const getTableHeaderFromJSON = async (jsonArray) =>{
    let result = Object.keys(jsonArray[0]);
    return result;
  }

  /**
   * Changes the URL to the current page number.
   */
  const changeURL = async (page) => {
    /*Set the new page number to the URL*/
    let url = window.location.pathname;
    url = `${url}?page=${page}`;
    window.history.replaceState("", "", url);
  };

  /**
   * It sorts an array of objects by a given property.
   * @param rows - the data to be sorted
   * @param column - The column to sort by.
   * @returns the sorted rows.
   */
  const sort = (rows, column, dateFormat) => {
    rows = rows.sort((a, b) => {
      /* Converting the value to a number if it is a number. */
      let fistValue = getSortValue(a[column], dateFormat);

      /* Converting the value to a number if it is a number. */
      let secondValue = getSortValue(b[column], dateFormat);

      if (fistValue < secondValue) {
        return -1;
      }
      if (fistValue < secondValue) {
        return 1;
      }
      return 0;
    });

    return rows;
  };

  /**
   * It sorts the rows in reverse order
   * @param rows - The array of objects that you want to sort.
   * @param column - The column to sort by.
   * @returns the sorted rows.
   */
  const reverseSort = (rows, column, dateFormat) => {
    rows = rows.sort((a, b) => {
      /* Converting the value to a number if it is a number. */
      let fistValue = getSortValue(a[column], dateFormat);

      /* Converting the value to a number if it is a number. */
      let secondValue = getSortValue(b[column], dateFormat);

      if (fistValue > secondValue) {
        return -1;
      }
      if (secondValue > fistValue) {
        return 1;
      }
      return 0;
    });

    return rows;
  };

  return {
    isNumber,
    parseDate,
    getDataFromJSON,
    getTableHeaderFromJSON,
    changeURL,
    sort,
    reverseSort,
  };
};

export default Utilities;