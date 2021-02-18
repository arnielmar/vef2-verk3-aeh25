export function getDate(date) {
  let theDate = date.substring(0, 10);
  theDate = theDate.split('-');
  theDate = `${theDate[2]}.${theDate[1]}.${theDate[0]}`;
  return theDate;
}
