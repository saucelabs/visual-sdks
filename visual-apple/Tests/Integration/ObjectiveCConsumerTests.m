#import <XCTest/XCTest.h>
#import <objc/runtime.h>
#if SAUCEVISUAL_SOURCE_PACKAGE
@import SauceVisual;
#else
#import <SauceVisual/SauceVisual-Swift.h>
#endif

extern void RunObjectiveCExample(SLVBuildOptions *options, void (^completion)(SLVBuild * _Nullable, NSError * _Nullable));

@interface ObjectiveCConsumerTests : XCTestCase
@end

@implementation ObjectiveCConsumerTests

- (void)testPublicObjectiveCRuntimeNames {
    XCTAssertTrue(objc_getClass("SLVClient") == SLVClient.class);
    XCTAssertTrue(objc_getClass("SLVRegion") == SLVRegion.class);
    XCTAssertTrue(objc_getClass("SLVBuildOptions") == SLVBuildOptions.class);
    XCTAssertTrue(objc_getClass("SLVBuild") == SLVBuild.class);
}

- (void)testObjectiveCExampleReportsConstructorErrorOnMainThread {
    // Fails in the constructor, before any request, so this runs without a backend: invalid credentials
    // when TEST_RUNNER_SAUCE_* is unset, otherwise the invalid build ID.
    SLVBuildOptions *options = [[SLVBuildOptions alloc] initWithName:@"Checkout flow" project:nil branch:nil
                                                       defaultBranch:nil customId:nil buildId:@"not-a-uuid"];
    XCTestExpectation *done = [self expectationWithDescription:@"Objective-C example"];
    done.assertForOverFulfill = YES;
    __block BOOL returned = NO;
    RunObjectiveCExample(options, ^(SLVBuild *build, NSError *error) {
        XCTAssertTrue(NSThread.isMainThread);
        XCTAssertTrue(returned);
        XCTAssertNil(build);
        XCTAssertEqualObjects(error.domain, SLVClient.errorDomain);
        XCTAssertTrue(error.code == SLVErrorCodeInvalidCredentials || error.code == SLVErrorCodeInvalidBuildId,
                      @"Unexpected code %ld", (long)error.code);
        [done fulfill];
    });
    returned = YES;
    [self waitForExpectations:@[done] timeout:10.0];
}

- (void)testRegionLookupUsesStableNSErrorCodes {
    NSError *error = nil;
    XCTAssertEqualObjects(SLVRegion.defaultRegion.name, @"us-west-1");
    XCTAssertEqualObjects([SLVRegion regionNamed:@"eu" error:&error].name, @"eu-central-1");
    XCTAssertNil(error);
    XCTAssertNil([SLVRegion regionNamed:@"mars" error:&error]);
    XCTAssertEqualObjects(error.domain, SLVClient.errorDomain);
    XCTAssertEqual(error.code, SLVErrorCodeUnknownRegion);
}

- (void)testClientRejectsEmptyCredentials {
    NSError *error = nil;
    SLVClient *client = [[SLVClient alloc] initWithUsername:@"user" accessKey:@""
                                                               region:SLVRegion.staging options:nil error:&error];
    XCTAssertNil(client);
    XCTAssertEqualObjects(error.domain, SLVClient.errorDomain);
    XCTAssertEqual(error.code, SLVErrorCodeInvalidCredentials);
}

- (void)testClientRejectsInvalidBuildId {
    NSError *error = nil;
    SLVBuildOptions *options = [[SLVBuildOptions alloc] initWithName:@"Build" project:nil branch:nil
                                                       defaultBranch:nil customId:nil buildId:@"not-a-uuid"];
    XCTAssertNil([[SLVClient alloc] initWithUsername:@"user" accessKey:@"key"
                                                   region:SLVRegion.staging options:options error:&error]);
    XCTAssertEqual(error.code, SLVErrorCodeInvalidBuildId);
}

- (void)testClientKeepsOptions {
    SLVBuildOptions *options = [[SLVBuildOptions alloc] initWithName:@"Build" project:@"Project" branch:nil
                                                       defaultBranch:nil customId:nil buildId:nil];
    SLVClient *client = [[SLVClient alloc] initWithUsername:@"user" accessKey:@"key"
                                                               region:SLVRegion.staging options:options error:nil];
    XCTAssertEqualObjects(client.options.name, @"Build");
    XCTAssertEqualObjects(client.options.project, @"Project");
    XCTAssertEqualObjects(client.region, SLVRegion.staging);
}

@end
