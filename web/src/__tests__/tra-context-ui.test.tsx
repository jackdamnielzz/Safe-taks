/**
 * TRA Context Fields UI Components Tests
 * Tests for MaterialsList and WorkplaceConditionsForm components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MaterialsList } from '@/components/tra/MaterialsList';
import { WorkplaceConditionsForm } from '@/components/tra/WorkplaceConditionsForm';
import type { Material, WorkplaceConditions } from '@/lib/types/tra';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'materials': 'Materialen',
      'addMaterial': 'Materiaal toevoegen',
      'materialName': 'Materiaalnaam',
      'quantity': 'Hoeveelheid',
      'unit': 'Eenheid',
      'hazardous': 'Gevaarlijk',
      'msdsRequired': 'MSDS vereist',
      'storageRequirements': 'Opslagvereisten',
      'workplaceConditions': 'Werkomstandigheden',
      'lighting': 'Verlichting',
      'ventilation': 'Ventilatie',
      'temperature': 'Temperatuur',
      'noise': 'Geluidsniveau',
      'spaceConstraint': 'Ruimtebeperking',
      'groundCondition': 'Ondergrondconditie',
      'weatherExposure': 'Blootstelling aan weer',
      'notes': 'Opmerkingen',
      'lightingOptions.adequate': 'Adequaat',
      'lightingOptions.poor': 'Slecht',
      'lightingOptions.dark': 'Donker',
      'lightingOptions.bright': 'Helder',
      'ventilationOptions.good': 'Goed',
      'ventilationOptions.moderate': 'Matig',
      'ventilationOptions.poor': 'Slecht',
      'ventilationOptions.none': 'Geen',
      'temperatureOptions.comfortable': 'Comfortabel',
      'temperatureOptions.hot': 'Heet',
      'temperatureOptions.cold': 'Koud',
      'temperatureOptions.extreme': 'Extreem',
      'noiseOptions.quiet': 'Stil',
      'noiseOptions.moderate': 'Matig',
      'noiseOptions.loud': 'Luid',
      'noiseOptions.extreme': 'Extreem',
      'spaceOptions.open': 'Open',
      'spaceOptions.confined': 'Beperkt',
      'spaceOptions.cramped': 'Krap',
      'spaceOptions.restricted': 'Beperkt toegankelijk',
      'groundOptions.stable': 'Stabiel',
      'groundOptions.uneven': 'Oneffen',
      'groundOptions.slippery': 'Glad',
      'groundOptions.unstable': 'Onstabiel',
      'weatherOptions.indoor': 'Binnen',
      'weatherOptions.sheltered': 'Beschut',
      'weatherOptions.exposed': 'Blootgesteld',
      'weatherOptions.extreme': 'Extreem',
    };
    return translations[key] || key;
  },
}));

describe('MaterialsList Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render empty state when no materials', () => {
      render(<MaterialsList materials={[]} onChange={mockOnChange} />);
      expect(screen.getByText('Materialen')).toBeInTheDocument();
      expect(screen.getByText('Materiaal toevoegen')).toBeInTheDocument();
      expect(screen.getByText('Nog geen materialen toegevoegd')).toBeInTheDocument();
    });

    it('should render materials list with items', () => {
      const materials: Material[] = [
        {
          id: 'mat-1',
          name: 'Cement',
          quantity: '50',
          unit: 'kg',
          hazardous: false,
          msdsRequired: false,
        },
      ];

      render(<MaterialsList materials={materials} onChange={mockOnChange} />);
      expect(screen.getByText('Cement')).toBeInTheDocument();
      expect(screen.getByText(/50 kg/)).toBeInTheDocument();
    });

    it('should show hazardous badge for hazardous materials', () => {
      const materials: Material[] = [
        {
          id: 'mat-1',
          name: 'Chemische Oplossing',
          quantity: '10',
          unit: 'liter',
          hazardous: true,
          msdsRequired: true,
        },
      ];

      render(<MaterialsList materials={materials} onChange={mockOnChange} />);
      expect(screen.getByText('Gevaarlijk')).toBeInTheDocument();
      expect(screen.getByText('MSDS Vereist')).toBeInTheDocument();
    });
  });

  describe('Add Material Functionality', () => {
    it('should show add form when clicking add button', () => {
      render(<MaterialsList materials={[]} onChange={mockOnChange} />);
      
      const addButton = screen.getByText('Materiaal toevoegen');
      fireEvent.click(addButton);

      expect(screen.getByLabelText(/Materiaalnaam/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Hoeveelheid/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Eenheid/)).toBeInTheDocument();
    });

    it('should add new material when form is submitted', async () => {
      render(<MaterialsList materials={[]} onChange={mockOnChange} />);
      
      // Open form
      fireEvent.click(screen.getByText('Materiaal toevoegen'));

      // Fill form
      const nameInput = screen.getByLabelText(/Materiaalnaam/);
      const quantityInput = screen.getByLabelText(/Hoeveelheid/);
      const unitInput = screen.getByLabelText(/Eenheid/);

      fireEvent.change(nameInput, { target: { value: 'Staal' } });
      fireEvent.change(quantityInput, { target: { value: '100' } });
      fireEvent.change(unitInput, { target: { value: 'kg' } });

      // Submit
      fireEvent.click(screen.getByText('Opslaan'));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'Staal',
              quantity: '100',
              unit: 'kg',
              hazardous: false,
              msdsRequired: false,
            }),
          ])
        );
      });
    });

    it('should show validation error for incomplete material', async () => {
      render(<MaterialsList materials={[]} onChange={mockOnChange} />);
      
      // Open form
      fireEvent.click(screen.getByText('Materiaal toevoegen'));

      // Try to save without filling required fields
      fireEvent.click(screen.getByText('Opslaan'));

      await waitFor(() => {
        expect(screen.getByText(/verplicht/i)).toBeInTheDocument();
      });

      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should cancel add operation', () => {
      render(<MaterialsList materials={[]} onChange={mockOnChange} />);
      
      // Open form
      fireEvent.click(screen.getByText('Materiaal toevoegen'));
      expect(screen.getByLabelText(/Materiaalnaam/)).toBeInTheDocument();

      // Cancel
      fireEvent.click(screen.getByText('Annuleren'));
      expect(screen.queryByLabelText(/Materiaalnaam/)).not.toBeInTheDocument();
    });
  });

  describe('Edit Material Functionality', () => {
    it('should edit existing material', async () => {
      const materials: Material[] = [
        {
          id: 'mat-1',
          name: 'Cement',
          quantity: '50',
          unit: 'kg',
          hazardous: false,
          msdsRequired: false,
        },
      ];

      render(<MaterialsList materials={materials} onChange={mockOnChange} />);
      
      // Click edit
      fireEvent.click(screen.getByText('Bewerken'));

      // Update quantity
      const quantityInput = screen.getByLabelText(/Hoeveelheid/);
      fireEvent.change(quantityInput, { target: { value: '75' } });

      // Save
      fireEvent.click(screen.getByText('Opslaan'));

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'mat-1',
              name: 'Cement',
              quantity: '75',
              unit: 'kg',
            }),
          ])
        );
      });
    });
  });

  describe('Delete Material Functionality', () => {
    it('should delete material', () => {
      const materials: Material[] = [
        {
          id: 'mat-1',
          name: 'Cement',
          quantity: '50',
          unit: 'kg',
          hazardous: false,
          msdsRequired: false,
        },
        {
          id: 'mat-2',
          name: 'Verf',
          quantity: '10',
          unit: 'liter',
          hazardous: false,
          msdsRequired: false,
        },
      ];

      render(<MaterialsList materials={materials} onChange={mockOnChange} />);
      
      // Delete first material
      const deleteButtons = screen.getAllByText('Verwijderen');
      fireEvent.click(deleteButtons[0]);

      expect(mockOnChange).toHaveBeenCalledWith([materials[1]]);
    });
  });

  describe('Read-Only Mode', () => {
    it('should hide action buttons in read-only mode', () => {
      const materials: Material[] = [
        {
          id: 'mat-1',
          name: 'Cement',
          quantity: '50',
          unit: 'kg',
          hazardous: false,
          msdsRequired: false,
        },
      ];

      render(<MaterialsList materials={materials} onChange={mockOnChange} readOnly={true} />);
      
      expect(screen.queryByText('Materiaal toevoegen')).not.toBeInTheDocument();
      expect(screen.queryByText('Bewerken')).not.toBeInTheDocument();
      expect(screen.queryByText('Verwijderen')).not.toBeInTheDocument();
    });
  });
});

describe('WorkplaceConditionsForm Component', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Basic Rendering', () => {
    it('should render all condition fields', () => {
      render(<WorkplaceConditionsForm onChange={mockOnChange} />);

      expect(screen.getByText('Werkomstandigheden')).toBeInTheDocument();
      expect(screen.getByLabelText('Verlichting')).toBeInTheDocument();
      expect(screen.getByLabelText('Ventilatie')).toBeInTheDocument();
      expect(screen.getByLabelText('Temperatuur')).toBeInTheDocument();
      expect(screen.getByLabelText('Geluidsniveau')).toBeInTheDocument();
      expect(screen.getByLabelText('Ruimtebeperking')).toBeInTheDocument();
      expect(screen.getByLabelText('Ondergrondconditie')).toBeInTheDocument();
      expect(screen.getByLabelText('Blootstelling aan weer')).toBeInTheDocument();
    });

    it('should render with default values', () => {
      render(<WorkplaceConditionsForm onChange={mockOnChange} />);

      const lightingSelect = screen.getByLabelText('Verlichting') as HTMLSelectElement;
      expect(lightingSelect.value).toBe('adequate');
    });

    it('should render with provided conditions', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'poor',
        ventilation: 'moderate',
        temperature: 'hot',
        noise: 'loud',
        spaceConstraint: 'confined',
        groundCondition: 'uneven',
        weatherExposure: 'exposed',
        notes: 'Test notes',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} />);

      // Query by id since labels may have badges from hazard suggestions
      const lightingSelect = document.getElementById('condition-lighting') as HTMLSelectElement;
      expect(lightingSelect).toBeInTheDocument();
      expect(lightingSelect.value).toBe('poor');
    });
  });

  describe('Condition Changes', () => {
    it('should call onChange when lighting is changed', () => {
      render(<WorkplaceConditionsForm onChange={mockOnChange} />);

      const lightingSelect = screen.getByLabelText('Verlichting');
      fireEvent.change(lightingSelect, { target: { value: 'dark' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ lighting: 'dark' })
      );
    });

    it('should call onChange when temperature is changed', () => {
      render(<WorkplaceConditionsForm onChange={mockOnChange} />);

      const tempSelect = screen.getByLabelText('Temperatuur');
      fireEvent.change(tempSelect, { target: { value: 'extreme' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ temperature: 'extreme' })
      );
    });

    it('should call onChange when notes are changed', () => {
      render(<WorkplaceConditionsForm onChange={mockOnChange} />);

      const notesTextarea = screen.getByLabelText('Opmerkingen');
      fireEvent.change(notesTextarea, { target: { value: 'Test opmerking' } });

      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({ notes: 'Test opmerking' })
      );
    });
  });

  describe('Extreme Conditions Warning', () => {
    it('should show warning for dark lighting', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'dark',
        ventilation: 'good',
        temperature: 'comfortable',
        noise: 'quiet',
        spaceConstraint: 'open',
        groundCondition: 'stable',
        weatherExposure: 'indoor',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} />);

      expect(screen.getByText(/Extreme werkomstandigheden/)).toBeInTheDocument();
      expect(screen.getByText(/Donkere verlichting/)).toBeInTheDocument();
    });

    it('should show warning for extreme temperature', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'adequate',
        ventilation: 'good',
        temperature: 'extreme',
        noise: 'quiet',
        spaceConstraint: 'open',
        groundCondition: 'stable',
        weatherExposure: 'indoor',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} />);

      expect(screen.getByText(/Extreme werkomstandigheden/)).toBeInTheDocument();
      expect(screen.getByText(/Extreme temperatuur/)).toBeInTheDocument();
    });

    it('should show warning for unstable ground', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'adequate',
        ventilation: 'good',
        temperature: 'comfortable',
        noise: 'quiet',
        spaceConstraint: 'open',
        groundCondition: 'unstable',
        weatherExposure: 'indoor',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} />);

      expect(screen.getByText(/Onstabiele ondergrond/)).toBeInTheDocument();
    });

    it('should show multiple extreme condition warnings', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'dark',
        ventilation: 'good',
        temperature: 'extreme',
        noise: 'extreme',
        spaceConstraint: 'open',
        groundCondition: 'unstable',
        weatherExposure: 'extreme',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} />);

      expect(screen.getByText(/Donkere verlichting/)).toBeInTheDocument();
      expect(screen.getByText(/Extreme temperatuur/)).toBeInTheDocument();
      expect(screen.getByText(/Extreem geluid/)).toBeInTheDocument();
      expect(screen.getByText(/Onstabiele ondergrond/)).toBeInTheDocument();
    });

    it('should not show warning for normal conditions', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'adequate',
        ventilation: 'good',
        temperature: 'comfortable',
        noise: 'quiet',
        spaceConstraint: 'open',
        groundCondition: 'stable',
        weatherExposure: 'indoor',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} />);

      expect(screen.queryByText(/Extreme werkomstandigheden/)).not.toBeInTheDocument();
    });
  });

  describe('Conditions Preview', () => {
    it('should show selected conditions in preview', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'bright',
        ventilation: 'moderate',
        temperature: 'hot',
        noise: 'loud',
        spaceConstraint: 'cramped',
        groundCondition: 'slippery',
        weatherExposure: 'exposed',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} />);

      // Check preview section (use getAllByText and check the second occurrence in the preview)
      const helderElements = screen.getAllByText('Helder');
      expect(helderElements.length).toBeGreaterThan(0);
      expect(helderElements[helderElements.length - 1]).toBeInTheDocument(); // Preview value

      expect(screen.getAllByText('Matig')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Heet')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Luid')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Krap')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Glad')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Blootgesteld')[0]).toBeInTheDocument();
    });
  });

  describe('Read-Only Mode', () => {
    it('should disable all inputs in read-only mode', () => {
      const conditions: WorkplaceConditions = {
        lighting: 'adequate',
        ventilation: 'good',
        temperature: 'comfortable',
        noise: 'quiet',
        spaceConstraint: 'open',
        groundCondition: 'stable',
        weatherExposure: 'indoor',
      };

      render(<WorkplaceConditionsForm conditions={conditions} onChange={mockOnChange} readOnly={true} />);

      const lightingSelect = screen.getByLabelText('Verlichting') as HTMLSelectElement;
      const notesTextarea = screen.getByLabelText('Opmerkingen') as HTMLTextAreaElement;

      expect(lightingSelect).toBeDisabled();
      expect(notesTextarea).toBeDisabled();
    });
  });
});