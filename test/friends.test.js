const assert = require('assert');
const main = require('../app');
const supertest = require('supertest');

const { app } = main();

describe('Friends Routes', async () => {
    const request = supertest(app.callback());

    describe('#friendList()', () => {

        // 未登录的测试用例
        it('should be not log in', async () => {
            const resp = await request.get('/friends/');
            assert.notEqual(resp, undefined);

            const result = JSON.parse(resp.text);
            assert.equal(result.error, '请先登录');
        })

        // 登录的测试用例
        it('should return list of friends', async () => {
            const resp = await request
                .post('/users/login')
                .send({
                    username: 'admin',
                    password: '12345678'
                })
            console.log(resp.text)

            assert.equal(resp.text, undefined);

            // const result = JSON.parse(resp.text);
            // assert.equal(result.error, '请先登录');
        })
    })

    // it('should return userId', function () {
    //     assert.equal(ctx.session.userId, 1);
    // });

    // afterEach(() => {
    //     sinon.restore();
    // });

    //
    // afterEach(() => {
    //     sinon.restore();
    // });
    //
    // it('should return friend list', async () => {
    //     const mockFriendList = [{ id: 1, name: 'John Doe' }];
    //     sinon.stub(Friends, 'getList').resolves(mockFriendList);
    //
    //     await friendController.friendList(ctx);
    //
    //     expect(ctx.body).to.deep.equal({
    //         status: 200,
    //         message: 'ok',
    //         data: {
    //             friendList: mockFriendList,
    //         },
    //     });
    // });
    //
    // it('should handle error when no userId in session', async () => {
    //     ctx.session = {};
    //
    //     try {
    //         await friendController.friendList(ctx);
    //     } catch (err) {
    //         expect(err).to.be.instanceOf(BadRequestError);
    //         expect(err.message).to.equal('User ID is required');
    //     }
    // });

    // 你可以根据需要添加更多的测试用例
});