import { TestBed } from '@angular/core/testing';
import { FormatPicker } from './format-picker';

describe('FormatPicker', () => {
  function createPicker(): FormatPicker {
    const fixture = TestBed.createComponent(FormatPicker);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FormatPicker] }).compileComponents();
  });

  it('starts with no format selected', () => {
    const picker = createPicker();

    expect(picker.value()).toBeNull();
  });

  it('exposes the three tournament formats', () => {
    const picker = createPicker();

    expect(picker.options.map((o) => o.id)).toEqual(['ROUND_ROBIN', 'SINGLE_ELIMINATION', 'GROUP_KNOCKOUT']);
  });

  it('updates the value when a format is chosen', () => {
    const picker = createPicker();

    picker.onChange('GROUP_KNOCKOUT');

    expect(picker.value()).toBe('GROUP_KNOCKOUT');
  });
});
