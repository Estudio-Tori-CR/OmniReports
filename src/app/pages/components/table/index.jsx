import React from "react";
import queryString from "query-string";
import Utilities from "./utilities";
import "./page.css";

const SortTable = ({ columnsNames = null, rows, max = 2, dateFormat = null, buttons = null, }) => {
  const {
    getDataFromJSON,
    getTableHeaderFromJSON,
    changeURL,
    sort,
    reverseSort,
  } = Utilities();
  const [state, saveState] = React.useState({
    page: 1,
    maxPage: 1,
    maxPaginator: 10,
    rows: [],
    filterRows: [],
    lastSortColumn: 0,
  });
  const [tableHeader, saveTableHeader] = React.useState([]);

  React.useEffect(() => {
    init();
  }, [rows]);

  /**
   * It gets the page number from the URL, then it gets the data from the JSON file, then it filters the
   * data by page number, then it saves the state.
   */
  const init = () => {
    /*Get the page in the URL*/
    let { page } = queryString.parse(window.location.search);
    getDataFromJSON([...rows]).then((data) => {
      let tmp = [...data];
      let min = 0;
      let maxPage = 1;
      /*Get the page and set the min for the splice*/
      if (page !== undefined) {
        page = parseInt(page);
        state.page = page;
        min = max * page - max;
      }

      /*Filter the array by page number*/
      if (max < tmp.length) {
        tmp = tmp.splice(min, max);
        maxPage = rows.length / max;
        maxPage = Math.round(maxPage);
      }

      state.filterRows = tmp;
      state.rows = [...data];
      state.maxPage = maxPage;
      state.maxPaginator = page ? (page === maxPage ? page : page + 9) : 10;
      saveState({ ...state });
    });

    if (columnsNames === null) {
      getTableHeaderFromJSON([...rows]).then((names) => {
        saveTableHeader(names);
      });
    } else {
      saveTableHeader(columnsNames);
    }
  };

  /*Nex page on the table*/
  const next = () => {
    if (state.page < state.maxPage) {
      let tmp = [...state.rows];
      tmp = tmp.splice(max * state.page, max);

      state.filterRows = tmp;
      state.page += 1;

      saveState({ ...state });

      changeURL(state.page).then(() => {
        changeMaxPaginator();
      });
    }
  };

  /*Previous page on the table*/
  const previous = () => {
    if (state.page > 1) {
      let tmp = [...state.rows];
      let previousPage = max * (state.page - 1) - max;
      tmp = tmp.splice(previousPage, max);

      state.filterRows = tmp;
      state.page -= 1;

      saveState({ ...state });

      changeURL(state.page).then(() => {
        changeMaxPaginator();
      });
    }
  };

  /**
   * It sorts the rows in the table by the column that was clicked on.
   * @param column - the column that was clicked
   */
  const onSort = (column) => {
    let tmp = [...state.rows];

    /*Calculate the type of sort*/
    tmp =
      state.lastSortColumn === column
        ? reverseSort(tmp, column, dateFormat)
        : sort(tmp, column, dateFormat);

    state.rows = [...tmp];

    /*Calculate items for page*/
    if (max < tmp.length) {
      let min = max * state.page - max;
      tmp = tmp.splice(min, max);
    }

    state.lastSortColumn = state.lastSortColumn === column ? -1 : column;
    state.filterRows = tmp;
    saveState({ ...state });
  };

  /*Change the items on the table by page (when the user do click un the paginator number)*/
  const changePagePaginator = (page) => {
    let tmp = [...state.rows];
    let min = 0;
    /*Get the page and set the min for the splice*/
    if (page !== undefined) {
      page = parseInt(page);
      state.page = page;
      min = max * page - max;
    }

    /*Filter the array by page number*/
    if (max < tmp.length) {
      tmp = tmp.splice(min, max);
    }

    state.filterRows = tmp;

    saveState({ ...state });

    changeURL(page).then(() => {
      changeMaxPaginator();
    });
  };

  const changeMaxPaginator = async () => {
    state.maxPaginator = state.page + 9;
    saveState({ ...state });
  };

  /**
   * It creates a paginator based on the current page and the maximum page
   * @returns An array of li elements.
   */
  const pages = () => {
    let currentPage = state.maxPaginator - 9;
    let paginator = [];

    if (currentPage > state.maxPage - 9 && state.maxPage > 9) {
      currentPage = state.maxPage - 9;
    } else if (state.maxPage < 9) {
      currentPage = 1;
    }

    /* Adding the first page to the paginator. */
    paginator.push(
      <li
        className={`${state.page === 1 && "active"}`}
        onClick={() => {
          changePagePaginator(1);
        }}
        key={`paginator_page_${1}`}
      >
        {1}
      </li>
    );

    /* Creating the paginator. */
    while (state.maxPage >= currentPage && currentPage <= state.maxPaginator) {
      if (currentPage !== 1) {
        const aux = currentPage;
        paginator.push(
          <li
            className={`${state.page === aux && "active"}`}
            onClick={() => {
              changePagePaginator(aux);
            }}
            key={`paginator_page_${currentPage}`}
          >
            {currentPage}
          </li>
        );
      }
      currentPage += 1;
    }

    /* Adding the last page to the paginator. */
    if (currentPage < state.maxPage) {
      paginator.push(
        <li
          onClick={() => {
            changePagePaginator(state.maxPage);
          }}
          key={`paginator_page_${state.maxPage}`}
        >
          {state.maxPage}
        </li>
      );
    }

    return <ul>{paginator}</ul>;
  };

  return (
    <div className='default-style-sort-table'>
      <table>
        <thead>
          <tr>
            {tableHeader.map((item, index) => {
              return (
                <th
                  onClick={() => {
                    onSort(index);
                  }}
                  key={`sort_table_column_${item}`}
                >
                  {item}
                </th>
              );
            })}
            {buttons ? <th>Actions</th>:""}
            
          </tr>
        </thead>
        <tbody>
          {state.filterRows.map((item, rowIndex) => (
            <tr key={`sort_table_row_${rowIndex}`}>
              {item.map((cell, cellIndex) => (
                <td key={`cell_${rowIndex}_${cellIndex}`}>{cell}</td>
              ))}

              {buttons && (
                <td>
                  {buttons.map((Btn, i) => (
                    <span key={`btn_${rowIndex}_${i}`}>
                      {typeof Btn === "function" ? Btn(item, rowIndex) : Btn}
                    </span>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className='paginator'>
        <button onClick={previous} type="button">{`<`}</button>
        {pages()}
        <button onClick={next} type="button">{`>`}</button>
      </div>
    </div>
  );
};

export default SortTable;