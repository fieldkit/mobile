import * as yup from "yup";

const flowSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
    showProgress: yup.boolean().required(),
});

const screenSchema = yup.object().shape({
    id: yup.string().required(),
    name: yup.string().required(),
    locale: yup.string().required(),
    forward: yup.string().required(),
    skip: yup.string().nullable(),
    guideTitle: yup.string().nullable(),
    guideUrl: yup.string().url().nullable(),
    header: yup.object().shape({
        title: yup.string().required(),
        subtitle: yup.string().required(),
    }),
    simple: yup.array().of(
        yup.object().shape({
            body: yup.string().required(),
            images: yup.array().of(
                yup.object().shape({
                    url: yup.string().required(),
                })
            ),
        })
    ),
});

const schema = yup.object().shape({
    data: yup.object().shape({
        flows: yup
            .array()
            .of(flowSchema)
            .default(() => {
                return [];
            }),
        screens: yup
            .array()
            .of(screenSchema)
            .default(() => {
                return [];
            }),
    }),
});

export default schema;
