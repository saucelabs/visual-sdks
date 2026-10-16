#import <Foundation/Foundation.h>
#if SAUCEVISUAL_SOURCE_PACKAGE
@import SauceVisual;
#else
#import <SauceVisual/SauceVisual-Swift.h>
#endif

// Completion is always on the main thread. Handle constructor errors separately.
void RunObjectiveCExample(void (^completion)(SLVSessionSummary * _Nullable, NSError * _Nullable)) {
    NSError *error = nil;
    SLVClient *client = [[SLVClient alloc] initWithSessionName:@"Checkout flow"
                                                   maximumCheckpoints:100
                                                                 error:&error];
    if (client == nil) {
        dispatch_async(dispatch_get_main_queue(), ^{ completion(nil, error); });
        return;
    }
    [client recordCheckpointWithName:@"Cart" completion:^(SLVCheckpointReceipt *receipt, NSError *failure) {
        if (failure != nil) {
            completion(nil, failure);
            return;
        }
        [client finishWithCompletion:completion];
    }];
}
