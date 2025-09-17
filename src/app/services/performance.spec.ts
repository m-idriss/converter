import { TestBed } from '@angular/core/testing';
import { PerformanceService } from './performance';

describe('PerformanceService', () => {
  let service: PerformanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerformanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get performance metrics', () => {
    const metrics = service.getPerformanceMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.bundleLoadTime).toBeGreaterThanOrEqual(0);
    expect(metrics.firstContentfulPaint).toBeGreaterThanOrEqual(0);
    expect(metrics.domContentLoaded).toBeGreaterThanOrEqual(0);
  });

  it('should get bundle metrics', () => {
    const bundle = service.getBundleMetrics();
    expect(bundle).toBeDefined();
    expect(bundle.initialSize).toBe(374.90);
    expect(bundle.lazyChunksCount).toBe(4);
    expect(bundle.totalLazySize).toBeCloseTo(546.56, 1);
  });

  it('should track file processing time', () => {
    const fileId = 'test-file';
    
    service.startFileProcessing(fileId);
    // Simulate some processing time
    const processingTime = service.endFileProcessing(fileId);
    
    expect(processingTime).toBeGreaterThanOrEqual(0);
  });

  it('should check roadmap targets', () => {
    const meetsTargets = service.meetsRoadmapTargets();
    // Bundle size should be under 500kB based on current build
    expect(meetsTargets).toBeTruthy();
  });

  it('should log performance report without throwing', () => {
    expect(() => service.logPerformanceReport()).not.toThrow();
  });
});