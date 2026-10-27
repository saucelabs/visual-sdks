#import <XCTest/XCTest.h>
#import <objc/runtime.h>
#if SAUCEVISUAL_SOURCE_PACKAGE
@import SauceVisual;
#else
#import <SauceVisual/SauceVisual-Swift.h>
#endif

extern void RunObjectiveCExample(void (^completion)(SLVSessionSummary * _Nullable, NSError * _Nullable));

@interface ObjectiveCConsumerTests : XCTestCase
@end

@implementation ObjectiveCConsumerTests

- (void)testDroppedClientAndTokenStillCompleteNeverInline {
    XCTestExpectation *done = [self expectationWithDescription:@"independent lifetime"];
    done.assertForOverFulfill = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
        __block BOOL returned = NO;
        @autoreleasepool {
            SLVClient *client = [[SLVClient alloc] initWithSessionName:@"Lifetime"
                                                            maximumCheckpoints:1 error:nil];
            [client recordCheckpointWithName:@"Retained operation" completion:^(SLVCheckpointReceipt *receipt, NSError *error) {
                XCTAssertTrue(NSThread.isMainThread);
                XCTAssertTrue(returned);
                XCTAssertNotNil(receipt);
                XCTAssertNil(error);
                XCTAssertEqual(receipt.sequence, 1);
                [done fulfill];
            }];
        }
        returned = YES;
    });
    [self waitForExpectations:@[done] timeout:10.0];
}

- (void)testCancellationFromConcurrentThreadsPreservesCommittedCount {
    SLVClient *client = [[SLVClient alloc] initWithSessionName:@"Cancellation"
                                                    maximumCheckpoints:1 error:nil];
    XCTestExpectation *done = [self expectationWithDescription:@"cancellation outcome"];
    done.assertForOverFulfill = YES;
    XCTestExpectation *cancelled = [self expectationWithDescription:@"concurrent cancel callers"];
    SLVOperation *operation = [client recordCheckpointWithName:@"Racing" completion:^(SLVCheckpointReceipt *receipt, NSError *error) {
        XCTAssertTrue(NSThread.isMainThread);
        XCTAssertTrue((receipt != nil) != (error != nil));
        if (error != nil) {
            XCTAssertEqualObjects(error.domain, SLVClient.errorDomain);
            XCTAssertEqual(error.code, SLVErrorCodeCancelled);
        }
        [client finishWithCompletion:^(SLVSessionSummary *summary, NSError *failure) {
            XCTAssertNil(failure);
            XCTAssertNotNil(summary);
            XCTAssertEqual(summary.checkpointCount, receipt != nil ? 1 : 0);
            [done fulfill];
        }];
    }];
    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        dispatch_apply(20, dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^(size_t index) {
            [operation cancel];
        });
        [cancelled fulfill];
    });
    [self waitForExpectations:@[done, cancelled] timeout:10.0];
}

- (void)testConstructorLimitAndCapacityUseStableNSErrorCodes {
    NSError *error = nil;
    XCTAssertNil([[SLVClient alloc] initWithSessionName:@"Valid" maximumCheckpoints:0 error:&error]);
    XCTAssertEqualObjects(error.domain, SLVClient.errorDomain);
    XCTAssertEqual(error.code, SLVErrorCodeInvalidCheckpointLimit);
    SLVClient *client = [[SLVClient alloc] initWithSessionName:@"Capacity" maximumCheckpoints:1 error:nil];
    XCTestExpectation *done = [self expectationWithDescription:@"capacity"];
    done.assertForOverFulfill = YES;
    [client recordCheckpointWithName:@"First" completion:^(SLVCheckpointReceipt *receipt, NSError *failure) {
        XCTAssertNotNil(receipt);
        XCTAssertNil(failure);
        [client recordCheckpointWithName:@"Second" completion:^(SLVCheckpointReceipt *extra, NSError *limit) {
            XCTAssertNil(extra);
            XCTAssertEqualObjects(limit.domain, SLVClient.errorDomain);
            XCTAssertEqual(limit.code, SLVErrorCodeCheckpointLimitReached);
            [done fulfill];
        }];
    }];
    [self waitForExpectations:@[done] timeout:10.0];
}

- (void)testObjectiveCExample {
    XCTestExpectation *done = [self expectationWithDescription:@"Objective-C example"];
    done.assertForOverFulfill = YES;
    RunObjectiveCExample(^(SLVSessionSummary *summary, NSError *error) {
        XCTAssertTrue(NSThread.isMainThread);
        XCTAssertNil(error);
        XCTAssertEqual(summary.checkpointCount, 1);
        XCTAssertTrue(summary.isMock);
        [done fulfill];
    });
    [self waitForExpectations:@[done] timeout:10.0];
}

- (void)testConstructorNSErrorContract {
    NSError *error = nil;
    SLVClient *client = [[SLVClient alloc] initWithSessionName:@"  "
                                                   maximumCheckpoints:10
                                                                 error:&error];
    XCTAssertNil(client);
    XCTAssertEqualObjects(error.domain, SLVClient.errorDomain);
    XCTAssertEqual(error.code, SLVErrorCodeInvalidSessionName);
}

- (void)testBackgroundEntryMainThreadCompletionAndLifecycle {
    NSError *error = nil;
    SLVClient *client = [[SLVClient alloc] initWithSessionName:@"ObjC"
                                                   maximumCheckpoints:10
                                                                 error:&error];
    XCTAssertNotNil(client);
    XCTAssertNil(error);
    XCTAssertTrue(client.isMock);
    XCTestExpectation *done = [self expectationWithDescription:@"one full lifecycle"];
    done.assertForOverFulfill = YES;

    dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        [client recordCheckpointWithName:@"  Home  " completion:^(SLVCheckpointReceipt *receipt, NSError *failure) {
            XCTAssertTrue(NSThread.isMainThread);
            XCTAssertNil(failure);
            XCTAssertNotNil(receipt);
            XCTAssertEqual(receipt.sequence, 1);
            XCTAssertEqualObjects(receipt.checkpointName, @"Home");
            XCTAssertTrue(receipt.isMock);
            [client finishWithCompletion:^(SLVSessionSummary *summary, NSError *finishFailure) {
                XCTAssertTrue(NSThread.isMainThread);
                XCTAssertNil(finishFailure);
                XCTAssertEqual(summary.checkpointCount, 1);
                XCTAssertTrue(summary.isMock);
                [client recordCheckpointWithName:@"Late" completion:^(SLVCheckpointReceipt *late, NSError *lateFailure) {
                    XCTAssertTrue(NSThread.isMainThread);
                    XCTAssertNil(late);
                    XCTAssertEqualObjects(lateFailure.domain, SLVClient.errorDomain);
                    XCTAssertEqual(lateFailure.code, SLVErrorCodeSessionFinished);
                    [done fulfill];
                }];
            }];
        }];
    });
    [self waitForExpectations:@[done] timeout:10.0];
}

- (void)testInvalidCheckpointReportsNSErrorAndDoesNotIncrementCount {
    NSError *error = nil;
    SLVClient *client = [[SLVClient alloc] initWithSessionName:@"Errors"
                                                   maximumCheckpoints:10
                                                                 error:&error];
    XCTAssertNotNil(client);
    XCTAssertNil(error);
    XCTestExpectation *done = [self expectationWithDescription:@"validation"];
    done.assertForOverFulfill = YES;
    [client recordCheckpointWithName:@"\n " completion:^(SLVCheckpointReceipt *receipt, NSError *failure) {
        XCTAssertTrue(NSThread.isMainThread);
        XCTAssertNil(receipt);
        XCTAssertNotNil(failure);
        XCTAssertEqualObjects(failure.domain, SLVClient.errorDomain);
        XCTAssertEqual(failure.code, SLVErrorCodeInvalidCheckpointName);
        [client finishWithCompletion:^(SLVSessionSummary *summary, NSError *finishFailure) {
            XCTAssertNil(finishFailure);
            XCTAssertNotNil(summary);
            XCTAssertEqual(summary.checkpointCount, 0);
            [done fulfill];
        }];
    }];
    [self waitForExpectations:@[done] timeout:10.0];
}

- (void)testPublicObjectiveCRuntimeNames {
    XCTAssertTrue(objc_getClass("SLVClient") == SLVClient.class);
    XCTAssertTrue(objc_getClass("SLVOperation") == SLVOperation.class);
    XCTAssertTrue(objc_getClass("SLVCheckpointReceipt") == SLVCheckpointReceipt.class);
    XCTAssertTrue(objc_getClass("SLVSessionSummary") == SLVSessionSummary.class);
}

- (void)testConcurrentEntriesReturnUniqueReceiptsOnMainThread {
    const NSUInteger count = 64;
    NSError *error = nil;
    SLVClient *client = [[SLVClient alloc] initWithSessionName:@"Concurrent callers"
                                        maximumCheckpoints:(NSInteger)count
                                                      error:&error];
    XCTAssertNotNil(client);
    XCTAssertNil(error);
    XCTestExpectation *done = [self expectationWithDescription:@"all receipts and summary"];
    done.assertForOverFulfill = YES;
    // Accessed only by the serialized main-thread completions below.
    NSMutableIndexSet *sequences = [NSMutableIndexSet indexSet];
    __block NSUInteger received = 0;
    for (NSUInteger index = 0; index < count; index++) {
        dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
            NSString *name = [NSString stringWithFormat:@"Checkpoint %lu", (unsigned long)index];
            [client recordCheckpointWithName:name completion:^(SLVCheckpointReceipt *receipt, NSError *failure) {
                XCTAssertTrue(NSThread.isMainThread);
                XCTAssertNotNil(receipt);
                XCTAssertNil(failure);
                XCTAssertFalse([sequences containsIndex:(NSUInteger)receipt.sequence]);
                [sequences addIndex:(NSUInteger)receipt.sequence];
                received += 1;
                XCTAssertLessThanOrEqual(received, count);
                if (received == count) {
                    XCTAssertEqual(sequences.count, count);
                    XCTAssertEqual(sequences.firstIndex, 1u);
                    XCTAssertEqual(sequences.lastIndex, count);
                    [client finishWithCompletion:^(SLVSessionSummary *summary, NSError *finishError) {
                        XCTAssertTrue(NSThread.isMainThread);
                        XCTAssertNotNil(summary);
                        XCTAssertNil(finishError);
                        XCTAssertEqual(summary.checkpointCount, (NSInteger)count);
                        [done fulfill];
                    }];
                }
            }];
        });
    }
    [self waitForExpectations:@[done] timeout:10.0];
}
@end
