import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslatePipe implements PipeTransform {

  transform(value: string, ...args: unknown[]): string {
    return value;
  }

}
