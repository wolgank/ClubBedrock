declare const reservationSpaceInscriptionRouter: import("hono/hono-base").HonoBase<import("hono/types").BlankEnv, {
    "/": {
        $post: {
            input: {};
            output: {
                error: {
                    bill: {
                        formErrors: string[];
                        fieldErrors: {
                            id?: string[] | undefined;
                            status?: string[] | undefined;
                            description?: string[] | undefined;
                            finalAmount?: string[] | undefined;
                            createdAt?: string[] | undefined;
                            dueDate?: string[] | undefined;
                            userId?: string[] | undefined;
                        };
                    } | null;
                    billDetail: {
                        formErrors: string[];
                        fieldErrors: {
                            id?: string[] | undefined;
                            description?: string[] | undefined;
                            price?: string[] | undefined;
                            discount?: string[] | undefined;
                            finalPrice?: string[] | undefined;
                        };
                    } | null;
                    inscription: {
                        formErrors: string[];
                        fieldErrors: {
                            userId?: string[] | undefined;
                            isCancelled?: string[] | undefined;
                        };
                    } | null;
                    reservation: {
                        formErrors: string[];
                        fieldErrors: {
                            date?: string[] | undefined;
                            id?: string[] | undefined;
                            name?: string[] | undefined;
                            description?: string[] | undefined;
                            capacity?: string[] | undefined;
                            startHour?: string[] | undefined;
                            endHour?: string[] | undefined;
                            allowOutsiders?: string[] | undefined;
                            spaceId?: string[] | undefined;
                        };
                    } | null;
                };
            };
            outputFormat: "json";
            status: 400;
        } | {
            input: {};
            output: {
                billId: number;
                billDetailId: number;
                reservationInscriptionId: number;
            };
            outputFormat: "json";
            status: 201;
        };
    };
}, "/">;
export default reservationSpaceInscriptionRouter;
