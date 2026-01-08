import { useMemo } from "react";

// using this with context?
interface PagiantionBarProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => any;
  onNext: () => any;
  onPrev: () => any;
}

export default function PaginationBar(props: PagiantionBarProps) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisibleButtons = 5; // How many buttons to show before using "..."

    if (props.totalPages <= maxVisibleButtons) {
      // Show all pages if total is small
      for (let i = 1; i <= props.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Logic for ellipsis truncation
      if (props.currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", props.totalPages);
      } else if (props.currentPage >= props.totalPages - 2) {
        pages.push(
          1,
          "...",
          props.totalPages - 3,
          props.totalPages - 2,
          props.totalPages - 1,
          props.totalPages
        );
      } else {
        pages.push(
          1,
          "...",
          props.currentPage - 1,
          props.currentPage,
          props.currentPage + 1,
          "...",
          props.totalPages
        );
      }
    }
    return pages;
  };
  const currentShowingItem = useMemo(() => {
    const firstItemOnPage = (props.currentPage - 1) * props.itemsPerPage + 1;
    const lastItemOnPage = Math.min(
      firstItemOnPage + props.itemsPerPage - 1,
      props.totalItems
    );
    return { firstItemOnPage, lastItemOnPage };
  }, [props.currentPage, props.totalPages]);
  return (
    // <div className="flex w-fit flex-wrap flex-row gap-1 justify-between bg-accent shadow-2xl shadow-black">
    //     {/* <button disabled={props.currentPage <= 1} className="p-2 text-center bg-accent border border-primary text-black hover:cursor-pointer hover:bg-primary hover:text-white"
    //      onClick={props.onPrev}>Prev</button>
    //     {getPageNumbers().map((item) => (
    //         <button disabled={typeof item === "string"} className={`p-2 text-center ${props.currentPage === item ? "bg-accent" : "bg-gray-500"} border border-primary text-black hover:cursor-pointer hover:bg-primary hover:text-white`}
    //         onClick={() => typeof item === 'number' && props.onPageChange(item)}>{item}</button>
    //     ))}
    //     <button className="p-2 text-center bg-accent border border-primary text-black hover:cursor-pointer hover:bg-primary hover:text-white"
    //      onClick={props.onNext}>Next</button> */}

    // </div>
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-border">
      <span className="text-secondary">
        Showing{" "}
        {`${currentShowingItem.firstItemOnPage} - ${currentShowingItem.lastItemOnPage}`}{" "}
        of {props.totalItems} events
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={props.onPrev}
          className="flex hover:cursor-pointer items-center gap-2 px-4 py-2 text-secondary hover:text-text transition-colors duration-200"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Previous
        </button>
        <div className="flex gap-2">
          {getPageNumbers().map((item) => (
            <button
              key={item}
              disabled={typeof item === "string"}
              onClick={() =>
                typeof item === "number" && props.onPageChange(item)
              }
              className={`px-4 py-2 hover:cursor-pointer ${
                props.currentPage === item
                  ? "bg-orange-500 text-white"
                  : "bg-white text-black transition-colors duration-200"
              } rounded-lg font-medium`}
            >
              {item}
            </button>
          ))}
        </div>

        <button
          onClick={props.onNext}
          className="flex hover:cursor-pointer items-center gap-2 px-4 py-2 text-text hover:text-primary transition-colors duration-200"
        >
          Next
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </nav>
  );
}
