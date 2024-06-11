export class MultiDateFormat {
    value = '';
    constructor() {}
    get display() {
      switch(this.value) {
        case 'mm.yyyy':
          return {
            dateInput: 'MM.YYYY',
            monthYearLabel: 'MM YYYY',
            dateA11yLabel: 'MM.YYYY',
            monthYearA11yLabel: 'MM YYYY',
          };
        case 'yyyy':
          return {
            dateInput: 'YYYY',
            monthYearLabel: 'MM YYYY',
            dateA11yLabel: 'MM.YYYY',
            monthYearA11yLabel: 'MM YYYY',
          };
          default:
            return {
              dateInput: 'DD.MM.YYYY',
              monthYearLabel: 'MMM YYYY',
              dateA11yLabel: 'LL',
              monthYearA11yLabel: 'MMMM YYYY',
            }
      }
  
    }
    get parse() {
      switch(this.value) {
        case 'mm.yyyy':
          return {
            dateInput: 'MM.YYYY'
          };
        case 'yyyy':
          return {
            dateInput: 'YYYY'
          };
          default:
            return {
              dateInput: 'DD.MM.YYYY'
            }
      }
  
    }
  }
  