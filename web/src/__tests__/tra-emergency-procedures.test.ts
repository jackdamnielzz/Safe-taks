/**
 * TRA Emergency Procedures Tests
 * 
 * Tests for emergency procedure functionality in TRAs
 * following VCA compliance requirements for HIGH/VERY_HIGH risk tasks
 */

import { EmergencyContact, EmergencyProcedure, TaskStep, RiskLevel } from '../lib/types/tra';
import { Timestamp } from 'firebase/firestore';

describe('TRA Emergency Procedures', () => {
  describe('EmergencyContact Type', () => {
    it('should validate emergency contact structure', () => {
      const contact: EmergencyContact = {
        name: 'John Safety',
        role: 'Site Safety Officer',
        phone: '+31612345678',
        email: 'john@example.com',
        availabilityHours: '24/7',
      };

      expect(contact.name).toBe('John Safety');
      expect(contact.role).toBe('Site Safety Officer');
      expect(contact.phone).toBe('+31612345678');
      expect(contact.email).toBe('john@example.com');
      expect(contact.availabilityHours).toBe('24/7');
    });

    it('should allow minimal emergency contact', () => {
      const contact: EmergencyContact = {
        name: 'Emergency Coordinator',
        role: 'Emergency Response',
        phone: '112',
      };

      expect(contact.name).toBe('Emergency Coordinator');
      expect(contact.role).toBe('Emergency Response');
      expect(contact.phone).toBe('112');
      expect(contact.email).toBeUndefined();
      expect(contact.availabilityHours).toBeUndefined();
    });
  });

  describe('EmergencyProcedure Type', () => {
    it('should validate complete emergency procedure structure', () => {
      const now = Timestamp.now();
      
      const procedure: EmergencyProcedure = {
        emergencyContacts: [
          {
            name: 'Site Safety Officer',
            role: 'Safety',
            phone: '+31612345678',
            email: 'safety@example.com',
          },
          {
            name: 'Emergency Coordinator',
            role: 'Coordinator',
            phone: '+31698765432',
          },
        ],
        stopWorkConditions: [
          'Onveilige weersomstandigheden',
          'Ontbrekende veiligheidsuitrusting',
          'Niet gekwalificeerd personeel',
        ],
        responseSteps: [
          'Stop onmiddellijk alle werkzaamheden',
          'Evacueer het gebied indien nodig',
          'Bel noodcontact',
          'Documenteer het incident',
        ],
        emergencyEquipment: [
          'EHBO-kit op locatie A',
          'Brandblusser bij ingang',
          'Nooddouche bij werkgebied',
        ],
        evacuationRoute: 'Via hoofduitgang naar verzamelpunt',
        assemblyPoint: 'Parkeerplaats voorzijde gebouw',
        nearestMedicalFacility: 'Ziekenhuis Stad, 5 km',
        createdAt: now,
        updatedAt: now,
      };

      expect(procedure.emergencyContacts).toHaveLength(2);
      expect(procedure.stopWorkConditions).toHaveLength(3);
      expect(procedure.responseSteps).toHaveLength(4);
      expect(procedure.emergencyEquipment).toHaveLength(3);
      expect(procedure.evacuationRoute).toBeDefined();
      expect(procedure.assemblyPoint).toBeDefined();
      expect(procedure.nearestMedicalFacility).toBeDefined();
    });

    it('should validate minimum required emergency contacts for high risk', () => {
      const procedure: EmergencyProcedure = {
        emergencyContacts: [
          { name: 'Contact 1', role: 'Safety', phone: '123' },
          { name: 'Contact 2', role: 'Medical', phone: '456' },
        ],
        stopWorkConditions: ['Condition 1'],
        responseSteps: ['Step 1'],
        emergencyEquipment: ['Equipment 1'],
        createdAt: Timestamp.now(),
      };

      // HIGH/VERY_HIGH risk requires minimum 2 contacts
      expect(procedure.emergencyContacts.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow optional fields to be undefined', () => {
      const procedure: EmergencyProcedure = {
        emergencyContacts: [
          { name: 'Contact 1', role: 'Safety', phone: '123' },
          { name: 'Contact 2', role: 'Medical', phone: '456' },
        ],
        stopWorkConditions: [],
        responseSteps: [],
        emergencyEquipment: [],
        createdAt: Timestamp.now(),
      };

      expect(procedure.evacuationRoute).toBeUndefined();
      expect(procedure.assemblyPoint).toBeUndefined();
      expect(procedure.nearestMedicalFacility).toBeUndefined();
      expect(procedure.updatedAt).toBeUndefined();
    });
  });

  describe('TaskStep with EmergencyProcedure', () => {
    it('should allow TaskStep with emergency procedure', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Werken op hoogte',
        duration: 120,
        hazards: [],
        emergencyProcedure: {
          emergencyContacts: [
            { name: 'Safety Officer', role: 'Safety', phone: '123' },
            { name: 'Medical', role: 'Medical', phone: '112' },
          ],
          stopWorkConditions: ['Harde wind', 'Regen'],
          responseSteps: ['Stop werk', 'Evacueer'],
          emergencyEquipment: ['Harnas', 'EHBO'],
          createdAt: Timestamp.now(),
        },
      };

      expect(taskStep.emergencyProcedure).toBeDefined();
      expect(taskStep.emergencyProcedure?.emergencyContacts).toHaveLength(2);
    });

    it('should allow TaskStep without emergency procedure', () => {
      const taskStep: TaskStep = {
        stepNumber: 1,
        description: 'Low risk task',
        hazards: [],
      };

      expect(taskStep.emergencyProcedure).toBeUndefined();
    });
  });

  describe('Emergency Procedure Validation', () => {
    it('should validate emergency contacts array is not empty for high risk', () => {
      const validateEmergencyContacts = (contacts: EmergencyContact[], riskLevel: RiskLevel) => {
        if (riskLevel === 'high' || riskLevel === 'very_high') {
          return contacts.length >= 2;
        }
        return true;
      };

      const contacts: EmergencyContact[] = [
        { name: 'Contact 1', role: 'Safety', phone: '123' },
        { name: 'Contact 2', role: 'Medical', phone: '456' },
      ];

      expect(validateEmergencyContacts(contacts, 'high')).toBe(true);
      expect(validateEmergencyContacts(contacts, 'very_high')).toBe(true);
      expect(validateEmergencyContacts([contacts[0]], 'high')).toBe(false);
      expect(validateEmergencyContacts(contacts, 'possible')).toBe(true);
    });

    it('should validate phone numbers are present', () => {
      const validateContact = (contact: EmergencyContact) => {
        return contact.phone && contact.phone.length > 0;
      };

      const validContact: EmergencyContact = {
        name: 'John',
        role: 'Safety',
        phone: '+31612345678',
      };

      expect(validateContact(validContact)).toBe(true);
    });

    it('should validate stop work conditions are defined', () => {
      const validateStopWorkConditions = (conditions: string[]) => {
        return Array.isArray(conditions);
      };

      expect(validateStopWorkConditions(['Condition 1'])).toBe(true);
      expect(validateStopWorkConditions([])).toBe(true);
    });

    it('should validate response steps are ordered', () => {
      const responseSteps = [
        'Stop werk onmiddellijk',
        'Bel noodcontact',
        'Evacueer indien nodig',
        'Documenteer incident',
      ];

      expect(responseSteps).toHaveLength(4);
      expect(responseSteps[0]).toContain('Stop');
      expect(responseSteps[responseSteps.length - 1]).toContain('Documenteer');
    });
  });

  describe('Emergency Procedure Creation and Updates', () => {
    it('should create emergency procedure with timestamp', () => {
      const now = Timestamp.now();
      
      const procedure: EmergencyProcedure = {
        emergencyContacts: [
          { name: 'Safety', role: 'Officer', phone: '123' },
          { name: 'Medical', role: 'Doctor', phone: '456' },
        ],
        stopWorkConditions: ['Wind > 50 km/h'],
        responseSteps: ['Stop', 'Call', 'Report'],
        emergencyEquipment: ['EHBO'],
        createdAt: now,
      };

      expect(procedure.createdAt).toBe(now);
      expect(procedure.updatedAt).toBeUndefined();
    });

    it('should update emergency procedure with new timestamp', () => {
      const created = Timestamp.now();
      const updated = Timestamp.now();
      
      const procedure: EmergencyProcedure = {
        emergencyContacts: [
          { name: 'Safety', role: 'Officer', phone: '123' },
          { name: 'Medical', role: 'Doctor', phone: '456' },
        ],
        stopWorkConditions: ['Updated condition'],
        responseSteps: ['Updated step'],
        emergencyEquipment: ['Updated equipment'],
        createdAt: created,
        updatedAt: updated,
      };

      expect(procedure.createdAt).toBe(created);
      expect(procedure.updatedAt).toBe(updated);
    });
  });

  describe('Risk Level Integration', () => {
    it('should require emergency procedure for HIGH risk tasks', () => {
      const requiresEmergencyProcedure = (riskLevel: RiskLevel): boolean => {
        return riskLevel === 'high' || riskLevel === 'very_high';
      };

      expect(requiresEmergencyProcedure('high')).toBe(true);
      expect(requiresEmergencyProcedure('very_high')).toBe(true);
      expect(requiresEmergencyProcedure('substantial')).toBe(false);
      expect(requiresEmergencyProcedure('possible')).toBe(false);
      expect(requiresEmergencyProcedure('acceptable')).toBe(false);
      expect(requiresEmergencyProcedure('trivial')).toBe(false);
    });

    it('should validate task step emergency procedure based on risk', () => {
      const validateTaskStepEmergencyProcedure = (
        step: TaskStep,
        overallRiskLevel: RiskLevel
      ): boolean => {
        if (overallRiskLevel === 'high' || overallRiskLevel === 'very_high') {
          return step.emergencyProcedure !== undefined &&
                 step.emergencyProcedure.emergencyContacts.length >= 2;
        }
        return true;
      };

      const highRiskStep: TaskStep = {
        stepNumber: 1,
        description: 'High risk task',
        hazards: [],
        emergencyProcedure: {
          emergencyContacts: [
            { name: 'Contact 1', role: 'Safety', phone: '123' },
            { name: 'Contact 2', role: 'Medical', phone: '456' },
          ],
          stopWorkConditions: [],
          responseSteps: [],
          emergencyEquipment: [],
          createdAt: Timestamp.now(),
        },
      };

      const lowRiskStep: TaskStep = {
        stepNumber: 2,
        description: 'Low risk task',
        hazards: [],
      };

      expect(validateTaskStepEmergencyProcedure(highRiskStep, 'high')).toBe(true);
      expect(validateTaskStepEmergencyProcedure(highRiskStep, 'very_high')).toBe(true);
      expect(validateTaskStepEmergencyProcedure(lowRiskStep, 'possible')).toBe(true);
      expect(validateTaskStepEmergencyProcedure(lowRiskStep, 'high')).toBe(false);
    });
  });

  describe('Emergency Equipment Validation', () => {
    it('should list required emergency equipment', () => {
      const equipment = [
        'EHBO-kit',
        'Brandblusser',
        'Nooddouche',
        'Oog spoelstation',
        'AED',
      ];

      expect(equipment).toContain('EHBO-kit');
      expect(equipment).toContain('AED');
      expect(equipment.length).toBeGreaterThan(0);
    });

    it('should validate equipment locations are specified', () => {
      const validateEquipment = (equipment: string[]): boolean => {
        return equipment.every(item => item && item.length > 0);
      };

      const validEquipment = [
        'EHBO-kit bij werkplek A',
        'Brandblusser bij ingang B',
      ];

      const invalidEquipment = [
        'EHBO-kit',
        '',  // Empty location
      ];

      expect(validateEquipment(validEquipment)).toBe(true);
      expect(validateEquipment(invalidEquipment)).toBe(false);
    });
  });

  describe('Evacuation and Assembly Points', () => {
    it('should validate evacuation route is defined for high risk', () => {
      const procedure: EmergencyProcedure = {
        emergencyContacts: [
          { name: 'Safety', role: 'Officer', phone: '123' },
          { name: 'Medical', role: 'Doctor', phone: '456' },
        ],
        stopWorkConditions: [],
        responseSteps: [],
        emergencyEquipment: [],
        evacuationRoute: 'Via hoofduitgang naar verzamelpunt',
        assemblyPoint: 'Parkeerplaats voorzijde',
        createdAt: Timestamp.now(),
      };

      expect(procedure.evacuationRoute).toBeDefined();
      expect(procedure.evacuationRoute).toContain('verzamelpunt');
      expect(procedure.assemblyPoint).toBeDefined();
    });

    it('should validate nearest medical facility is documented', () => {
      const procedure: EmergencyProcedure = {
        emergencyContacts: [
          { name: 'Safety', role: 'Officer', phone: '123' },
          { name: 'Medical', role: 'Doctor', phone: '456' },
        ],
        stopWorkConditions: [],
        responseSteps: [],
        emergencyEquipment: [],
        nearestMedicalFacility: 'Ziekenhuis Stad, Adres 123, 5 km, tel: 020-1234567',
        createdAt: Timestamp.now(),
      };

      expect(procedure.nearestMedicalFacility).toBeDefined();
      expect(procedure.nearestMedicalFacility).toContain('Ziekenhuis');
      expect(procedure.nearestMedicalFacility).toContain('km');
    });
  });
});