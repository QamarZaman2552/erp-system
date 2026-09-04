import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private searchTerm = signal('');
  search = computed(() => this.searchTerm());

  setSearch(term: string): void {
    this.searchTerm.set(term);
  }

  clear(): void {
    this.searchTerm.set('');
  }
}
